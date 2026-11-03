import { RevenueView } from "./revenue-view";

// RequireAuth ở admin/layout chỉ render trang sau khi đọc phiên ở trình duyệt → lúc prerender segment này bị bỏ qua có chủ đích
export const instant = false;

export default function AdminHomePage() {
  return <RevenueView />;
}
