"use client";

import { useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ApiError, startSessionSync } from "@/lib/api";

let browserQueryClient: QueryClient | undefined;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Lỗi 4xx (404, 403...) thử lại cũng vô ích → chỉ thử lại lỗi mạng / 5xx, tối đa 2 lần
        retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
      },
    },
  });
}

function getQueryClient() {
  // Server: mỗi lần render một client riêng (không lẫn dữ liệu giữa người dùng). Trình duyệt: dùng lại một client.
  if (typeof window === "undefined") return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  // Mở trang / F5: lấy lại phiên từ cookie HttpOnly (access token chỉ ở RAM nên đã mất) + đồng bộ đăng nhập giữa các tab
  useEffect(() => startSessionSync(), []);

  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
      <Toaster
        theme="dark"
        position="top-center"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: "var(--font-be-vietnam)" } }}
      />
    </QueryClientProvider>
  );
}
