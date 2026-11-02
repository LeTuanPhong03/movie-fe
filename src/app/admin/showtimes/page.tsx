import type { Metadata } from "next";
import { AdminShowtimesView } from "./admin-showtimes-view";

export const metadata: Metadata = { title: "Suất chiếu" };

export default function AdminShowtimesPage() {
  return <AdminShowtimesView />;
}
