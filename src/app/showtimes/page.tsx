import type { Metadata } from "next";
import { ShowtimesView } from "./showtimes-view";

export const metadata: Metadata = { title: "Lịch chiếu" };

export default function ShowtimesPage() {
  return <ShowtimesView />;
}
