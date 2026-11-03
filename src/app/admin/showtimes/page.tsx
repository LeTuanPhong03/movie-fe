import type { Metadata } from "next";
import { AdminShowtimesView } from "./admin-showtimes-view";

export const metadata: Metadata = { title: "Suất chiếu" };

// RequireAuth ở admin/layout chỉ render trang sau khi đọc phiên ở trình duyệt → lúc prerender segment này bị bỏ qua có chủ đích
export const instant = false;

export default function AdminShowtimesPage() {
  return <AdminShowtimesView />;
}
