import type { Metadata } from "next";
import { AdminTheatersView } from "./admin-theaters-view";

export const metadata: Metadata = { title: "Phòng chiếu" };

// RequireAuth ở admin/layout chỉ render trang sau khi đọc phiên ở trình duyệt → lúc prerender segment này bị bỏ qua có chủ đích
export const instant = false;

export default function AdminTheatersPage() {
  return <AdminTheatersView />;
}
