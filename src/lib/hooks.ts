"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { authStore } from "./auth-store";
import { toVnDateString } from "./format";

/** Phiên đăng nhập hiện tại. Lúc prerender trên server luôn là null (server không có localStorage). */
export function useSession() {
  return useSyncExternalStore(authStore.subscribe, authStore.get, () => null);
}

const noop = () => () => {};

/** true sau khi đã chạy ở trình duyệt — dùng để không render khác nhau giữa server và client (lỗi hydration). */
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/**
 * Thời điểm hiện tại, cập nhật mỗi `intervalMs`. Trả null lúc prerender: Next 16 (cacheComponents) không cho
 * đọc giờ hiện tại khi prerender, và giờ server khác giờ trình duyệt sẽ gây lệch hydration.
 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // Gọi qua setTimeout 0 để lần đầu cũng chạy ngoài phần render của effect (tránh cảnh báo setState đồng bộ).
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}

/** Ngày hôm nay theo giờ VN ("YYYY-MM-DD"), null lúc prerender. */
export function useToday() {
  const now = useNow(60_000);
  return now === null ? null : toVnDateString(new Date(now));
}
