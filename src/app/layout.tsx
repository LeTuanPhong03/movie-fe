import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Be_Vietnam_Pro } from "next/font/google";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Spinner } from "@/components/ui";
import "./globals.css";

// Be Vietnam Pro: font thiết kế cho tiếng Việt, dấu không bị chồng/lệch như nhiều font Latin
const font = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: { default: "CineViet — Đặt vé xem phim", template: "%s · CineViet" },
  description: "Xem lịch chiếu, chọn ghế và đặt vé xem phim trực tuyến.",
};

export const viewport: Viewport = {
  themeColor: "#07070b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${font.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          {/* Header đọc URL + phiên đăng nhập (chỉ có ở trình duyệt) → để trong Suspense cho Next prerender phần còn lại */}
          <Suspense fallback={<div className="h-16" />}>
            <Header />
          </Suspense>
          <main className="flex-1">
            <Suspense
              fallback={
                <div className="grid min-h-[60vh] place-items-center">
                  <Spinner className="size-8" />
                </div>
              }
            >
              {children}
            </Suspense>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
