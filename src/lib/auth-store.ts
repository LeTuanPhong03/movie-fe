import type { AuthResponse, UserDto } from "./types";

// Kho phiên đăng nhập — CHỈ nằm trong bộ nhớ (biến JS), không ghi localStorage:
// - access token trong RAM: F5 là mất, nhưng script độc (XSS) không lục được ở chỗ lưu trữ lâu dài nào.
// - refresh token nằm trong cookie HttpOnly do BE đặt, JS không đọc được → F5 thì gọi /refresh để lấy lại phiên.
// Ở localStorage chỉ còn một cờ "đã đăng nhập" (không bí mật): khách chưa đăng nhập khỏi gọi /refresh vô ích,
// và tab khác nghe sự kiện "storage" của cờ này để đăng nhập / đăng xuất theo.

export interface Session {
  user: UserDto;
  accessToken: string;
  accessTokenExpiresAt: string;
}

export const LOGGED_IN_KEY = "movie.loggedIn";

const listeners = new Set<() => void>();
let session: Session | null = null;
// false cho tới khi lần khôi phục phiên đầu tiên (gọi /refresh lúc mở trang) xong: chưa biết là khách hay đã đăng nhập
let ready = false;

function emit() {
  listeners.forEach((l) => l());
}

function setFlag(loggedIn: boolean) {
  try {
    if (loggedIn) localStorage.setItem(LOGGED_IN_KEY, "1");
    else localStorage.removeItem(LOGGED_IN_KEY);
  } catch {
    /* ẩn danh chặn localStorage: chỉ mất tính năng đồng bộ giữa các tab */
  }
}

export const authStore = {
  get: (): Session | null => session,
  isReady: () => ready,

  hasFlag() {
    try {
      return localStorage.getItem(LOGGED_IN_KEY) === "1";
    } catch {
      return true; // không đọc được cờ thì cứ thử /refresh, tệ nhất là nhận 401
    }
  },

  set(response: AuthResponse) {
    session = { user: response.user, accessToken: response.accessToken, accessTokenExpiresAt: response.accessTokenExpiresAt };
    setFlag(true);
    emit();
  },

  clear() {
    session = null;
    setFlag(false);
    emit();
  },

  markReady() {
    ready = true;
    emit();
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
