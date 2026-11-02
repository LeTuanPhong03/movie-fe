import type { Metadata } from "next";
import { AdminReservationsView } from "./admin-reservations-view";

export const metadata: Metadata = { title: "Đơn đặt vé" };

export default function AdminReservationsPage() {
  return <AdminReservationsView />;
}
