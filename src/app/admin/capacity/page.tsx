import type { Metadata } from "next";
import { CapacityView } from "./capacity-view";

export const metadata: Metadata = { title: "Công suất" };

// RequireAuth ở admin/layout chỉ render trang sau khi đọc phiên ở trình duyệt → lúc prerender segment này bị bỏ qua có chủ đích
export const instant = false;

export default function AdminCapacityPage() {
  return <CapacityView />;
}
