"use client";

import { toast as sonner } from "sonner";

// Toast của sonner tự biến mất sau vài giây → khách đọc không kịp là mất. Mọi chỗ gọi `toast` từ file này thay vì
// từ "sonner": vẫn hiện toast như cũ, đồng thời lưu vào lịch sử (localStorage) để chuông thông báo ở header hiện lại.

export type NoticeType = "success" | "error" | "warning" | "info";

export interface Notice {
  id: string;
  type: NoticeType;
  message: string;
  at: number;
}

interface State {
  items: Notice[];
  /** Thời điểm mở chuông gần nhất: thông báo mới hơn mốc này là chưa đọc. */
  seenAt: number;
}

const KEY = "notifications";
const MAX = 30;
const EMPTY: State = { items: [], seenAt: 0 };

let state: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (saved && Array.isArray(saved.items)) return saved;
  } catch {}
  return EMPTY;
}

function get(): State {
  if (typeof window === "undefined") return EMPTY;
  return (state ??= load());
}

function set(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function push(type: NoticeType, message: string) {
  const s = get();
  const notice: Notice = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, type, message, at: Date.now() };
  set({ ...s, items: [notice, ...s.items].slice(0, MAX) });
}

/** Kho thông báo cho useSyncExternalStore (giống authStore): server luôn thấy rỗng để không lệch hydration. */
export const notifications = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  get,
  getServer: () => EMPTY,
  markSeen() {
    const s = get();
    if (s.items.length > 0 && s.items[0].at > s.seenAt) set({ ...s, seenAt: Date.now() });
  },
  /** Gọi khi đăng xuất: máy dùng chung thì người sau không đọc được thông báo của người trước. */
  clear() {
    set({ items: [], seenAt: Date.now() });
  },
};

export const toast = {
  success: (message: string) => {
    push("success", message);
    return sonner.success(message);
  },
  error: (message: string) => {
    push("error", message);
    return sonner.error(message);
  },
  warning: (message: string) => {
    push("warning", message);
    return sonner.warning(message);
  },
  info: (message: string) => {
    push("info", message);
    return sonner.info(message);
  },
};
