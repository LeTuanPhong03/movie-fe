import type { Metadata } from "next";
import { AdminReservationsView } from "./admin-reservations-view";

export const metadata: Metadata = { title: "Đơn đặt vé" };

// RequireAuth ở admin/layout chỉ render trang sau khi đọc phiên ở trình duyệt → lúc prerender segment này bị bỏ qua có chủ đích
export const instant = false;

export default function AdminReservationsPage() {
  return <AdminReservationsView />;
}
