"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { BarChart3, CalendarPlus, Clapperboard, DoorOpen, Gauge, ReceiptText, Undo2, Users } from "lucide-react";

const items = [
  { href: "/admin", label: "Doanh thu", icon: BarChart3 },
  { href: "/admin/capacity", label: "Công suất", icon: Gauge },
  { href: "/admin/reservations", label: "Đơn đặt", icon: ReceiptText },
  { href: "/admin/refunds", label: "Hoàn tiền", icon: Undo2 },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/movies", label: "Phim", icon: Clapperboard },
  { href: "/admin/showtimes", label: "Suất chiếu", icon: CalendarPlus },
  { href: "/admin/theaters", label: "Phòng chiếu", icon: DoorOpen },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar -mx-4 mt-6 flex gap-1 overflow-x-auto border-b border-ink-800 px-4 sm:mx-0 sm:px-0">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium transition",
              active ? "text-white" : "text-ink-400 hover:text-white",
            )}
          >
            <Icon className="size-4" /> {label}
            {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-500" />}
          </Link>
        );
      })}
    </nav>
  );
}
