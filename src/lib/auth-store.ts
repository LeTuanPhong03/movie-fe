import type { AuthResponse, UserDto } from "./types";

// Kho phiên đăng nhập: lưu ở localStorage để F5 không mất, phát sự kiện để mọi component cập nhật (useSyncExternalStore).
// Nghe thêm sự kiện "storage" để đăng xuất ở tab này thì tab kia cũng đăng xuất.

export interface Session {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
}

const KEY = "movie.session";
const listeners = new Set<() => void>();
let cached: Session | null | undefined;

function read(): Session | null {
  if (cached !== undefined) return cached;
  try {
    const raw = localStorage.getItem(KEY);
    cached = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    cached = null;
  }
  return cached;
}

function emit() {
  listeners.forEach((l) => l());
}

export const authStore = {
  get: (): Session | null => (typeof window === "undefined" ? null : read()),

  set(response: AuthResponse) {
    cached = {
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      accessTokenExpiresAt: response.accessTokenExpiresAt,
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(cached));
    } catch {
      /* chế độ ẩn danh chặn localStorage: vẫn giữ trong bộ nhớ */
    }
    emit();
  },

  clear() {
    cached = null;
    try {
      localStorage.removeItem(KEY);
    } catch {}
    emit();
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        cached = undefined;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
};
