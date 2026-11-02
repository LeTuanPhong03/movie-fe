import type { Metadata } from "next";
import { AdminMoviesView } from "./admin-movies-view";

export const metadata: Metadata = { title: "Phim" };

export default function AdminMoviesPage() {
  return <AdminMoviesView />;
}
