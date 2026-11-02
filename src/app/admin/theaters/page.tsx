import type { Metadata } from "next";
import { AdminTheatersView } from "./admin-theaters-view";

export const metadata: Metadata = { title: "Phòng chiếu" };

export default function AdminTheatersPage() {
  return <AdminTheatersView />;
}
