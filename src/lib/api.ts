import { authStore, LOGGED_IN_KEY } from "./auth-store";
import { parseUtc } from "./format";
import type { AuthResponse, ProblemDetails } from "./types";

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

// Đường dẫn tương đối, cùng origin với FE: next.config.ts (rewrites) chuyển tiếp /api/* sang BE.
// Cùng origin nên fetch tự gửi kèm cookie refresh token, không cần CORS hay credentials: "include".
function buildUrl(path: string, query?: Query) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

// ─── Làm mới token ───────────────────────────────────────────────
// BE dùng refresh token rotation: mỗi refresh token chỉ dùng được MỘT lần. Nếu 3 request cùng nhận 401 rồi cùng gọi
// /refresh với một token, 2 cái sau sẽ thất bại và người dùng bị đăng xuất oan. Vì vậy trong 1 tab dùng chung 1 promise.
// Giữa các tab: mọi tab dùng CHUNG một cookie → 2 tab mở cùng lúc cũng đụng nhau y như vậy. Web Locks API cho các tab
// xếp hàng: tab sau chỉ gửi /refresh khi tab trước xong, lúc đó trình duyệt đã ghi cookie mới nên tab sau gửi cookie mới.
let refreshing: Promise<boolean> | null = null;

async function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) return await navigator.locks.request("movie-refresh", fn);
  return fn(); // trình duyệt quá cũ: chấp nhận rủi ro 2 tab đụng nhau
}

function refreshSession(): Promise<boolean> {
  refreshing ??= withRefreshLock(async () => {
    try {
      // Không gửi body: refresh token nằm trong cookie HttpOnly, trình duyệt tự đính kèm
      const res = await fetch(buildUrl("/api/auth/refresh"), { method: "POST" });
      if (!res.ok) {
        authStore.clear();
        return false;
      }
      authStore.set((await res.json()) as AuthResponse);
      return true;
    } catch {
      return false; // mất mạng: giữ phiên (nếu có), lần sau thử lại
    }
  }).finally(() => {
    refreshing = null;
  });
  return refreshing;
}

// ─── Khôi phục phiên khi mở trang / F5 ────────────────────────────
// Access token chỉ ở RAM nên mỗi lần tải trang là mất → đổi cookie lấy access token mới. Chạy đúng 1 lần mỗi lần tải trang.
let restoring: Promise<void> | null = null;

export function restoreSession() {
  restoring ??= (authStore.hasFlag() ? refreshSession() : Promise.resolve(false)).then(() => authStore.markReady());
  return restoring;
}

/**
 * Gọi 1 lần ở Providers: khôi phục phiên + đồng bộ giữa các tab (tab khác đăng nhập → tab này lấy phiên,
 * tab khác đăng xuất → tab này xoá phiên). Trả về hàm huỷ lắng nghe.
 */
export function startSessionSync() {
  try {
    localStorage.removeItem("movie.session"); // bản cũ lưu cả refresh token ở đây → xoá cho sạch
  } catch {}
  restoreSession();
  const onStorage = (e: StorageEvent) => {
    if (e.key !== LOGGED_IN_KEY) return;
    if (e.newValue === "1") refreshSession();
    else if (authStore.get()) authStore.clear();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

/** Access token sống 15 phút: còn dưới 30 giây thì làm mới trước, đỡ một vòng 401 → refresh → gọi lại. */
async function getAccessToken() {
  await restoreSession(); // request bắn ra lúc trang vừa mở: chờ khôi phục phiên xong mới biết có token hay không
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

/** Đăng xuất: xoá phiên ở RAM trước (người dùng thấy ngay), rồi để BE thu hồi refresh token + xoá cookie. */
export async function logout() {
  authStore.clear();
  await api("/api/auth/logout", { method: "POST", auth: false }).catch(() => {});
}
