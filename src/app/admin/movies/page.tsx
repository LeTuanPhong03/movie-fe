import type { Metadata } from "next";
import { AdminMoviesView } from "./admin-movies-view";

export const metadata: Metadata = { title: "Phim" };

// RequireAuth ở admin/layout chỉ render trang sau khi đọc phiên ở trình duyệt → lúc prerender segment này bị bỏ qua có chủ đích
export const instant = false;

export default function AdminMoviesPage() {
  return <AdminMoviesView />;
}
