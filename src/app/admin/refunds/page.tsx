import type { Metadata } from "next";
import { AdminRefundsView } from "./admin-refunds-view";

export const metadata: Metadata = { title: "Hoàn tiền" };

// RequireAuth ở admin/layout chỉ render trang sau khi đọc phiên ở trình duyệt → lúc prerender segment này bị bỏ qua có chủ đích
export const instant = false;

export default function AdminRefundsPage() {
  return <AdminRefundsView />;
}
