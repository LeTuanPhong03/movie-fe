import { authStore } from "./auth-store";
import { parseUtc } from "./format";
import type { AuthResponse, ProblemDetails } from "./types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5161").replace(/\/$/, "");

/** Lỗi từ API, mang theo ProblemDetails để hiển thị đúng thông điệp tiếng Việt BE đã viết sẵn. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public problem: ProblemDetails = {},
  ) {
    super(problem.detail || firstValidationError(problem) || problem.title || defaultMessage(status));
  }

  /** Lỗi validation của một trường (BE trả key PascalCase, ví dụ "Password") — so khớp không phân biệt hoa thường. */
  fieldError(field: string) {
    const entry = Object.entries(this.problem.errors ?? {}).find(([k]) => k.toLowerCase() === field.toLowerCase());
    return entry?.[1]?.[0];
  }
}

function firstValidationError(p: ProblemDetails) {
  const first = Object.values(p.errors ?? {})[0];
  return first?.[0];
}

function defaultMessage(status: number) {
  if (status === 0) return "Không kết nối được máy chủ. Kiểm tra backend đã chạy chưa.";
  if (status === 401) return "Phiên đăng nhập đã hết, vui lòng đăng nhập lại.";
  if (status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (status === 404) return "Không tìm thấy dữ liệu.";
  return "Đã có lỗi xảy ra, vui lòng thử lại.";
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
  /** false: không gắn token (endpoint công khai) và không thử refresh khi 401. */
  auth?: boolean;
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(API_URL + path);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  return url.toString();
}

// ─── Làm mới token ───────────────────────────────────────────────
// BE dùng refresh token rotation: mỗi refresh token chỉ dùng được MỘT lần. Nếu 3 request cùng nhận 401 rồi cùng gọi
// /refresh với một token, 2 cái sau sẽ thất bại và người dùng bị đăng xuất oan. Vì vậy mọi nơi dùng chung 1 promise.
let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  const session = authStore.get();
  if (!session) return Promise.resolve(false);
  refreshing ??= (async () => {
    try {
      const res = await fetch(buildUrl("/api/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      if (!res.ok) {
        authStore.clear();
        return false;
      }
      authStore.set((await res.json()) as AuthResponse);
      return true;
    } catch {
      return false; // mất mạng: giữ phiên, lần sau thử lại
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** Access token sống 15 phút: còn dưới 30 giây thì làm mới trước, đỡ một vòng 401 → refresh → gọi lại. */
async function getAccessToken() {
  const session = authStore.get();
  if (!session) return null;
  if (parseUtc(session.accessTokenExpiresAt).getTime() - Date.now() < 30_000) {
    await refreshSession();
  }
  return authStore.get()?.accessToken ?? null;
}

export async function api<T = void>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true } = options;

  const send = async () => {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth) {
      const token = await getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let res: Response;
  try {
    res = await send();
    if (res.status === 401 && auth && authStore.get() && (await refreshSession())) {
      res = await send();
    }
  } catch {
    throw new ApiError(0);
  }

  if (!res.ok) {
    let problem: ProblemDetails = {};
    try {
      problem = await res.json();
    } catch {}
    throw new ApiError(res.status, problem);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
}

/** Đăng xuất: xoá phiên ở máy trước (người dùng thấy ngay), rồi báo BE thu hồi refresh token. */
export async function logout() {
  const session = authStore.get();
  authStore.clear();
  if (session) {
    await api("/api/auth/logout", { method: "POST", body: { refreshToken: session.refreshToken }, auth: false }).catch(() => {});
  }
}
