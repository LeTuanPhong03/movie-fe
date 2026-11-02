import type { Metadata } from "next";
import { RequireAuth } from "@/components/require-auth";
import { Container } from "@/components/ui";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = { title: { default: "Quản trị", template: "%s · Quản trị CineViet" } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <RequireAuth role="Admin">
      <Container className="pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">Quản trị</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-white">Bảng điều khiển</h1>
          </div>
        </div>
        <AdminNav />
        <div className="mt-6">{children}</div>
      </Container>
    </RequireAuth>
  );
}
