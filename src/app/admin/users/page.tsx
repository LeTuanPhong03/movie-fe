import type { Metadata } from "next";
import { AdminUsersView } from "./admin-users-view";

export const metadata: Metadata = { title: "Người dùng" };

// RequireAuth ở admin/layout chỉ render trang sau khi đọc phiên ở trình duyệt → lúc prerender segment này bị bỏ qua có chủ đích
export const instant = false;

export default function AdminUsersPage() {
  return <AdminUsersView />;
}
