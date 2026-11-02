import type { Metadata } from "next";
import { MoviesView } from "./movies-view";

export const metadata: Metadata = { title: "Phim đang chiếu" };

export default function MoviesPage() {
  return <MoviesView />;
}
