import type { NextConfig } from "next";

// Địa chỉ backend — chỉ server Next đọc (không có NEXT_PUBLIC_), trình duyệt không cần biết.
// rewrites được tính lúc build → trên host deploy phải đặt biến này TRƯỚC khi build.
const API_URL = (process.env.API_URL ?? "http://localhost:5161").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Trình duyệt chỉ gọi /api/... trên chính domain FE, Next chuyển tiếp sang BE. Nhờ vậy cookie refresh token là
  // cookie "cùng site" (first-party): Safari / Chrome chặn cookie bên thứ ba sẽ không chặn nó, và SameSite=Lax dùng được.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
