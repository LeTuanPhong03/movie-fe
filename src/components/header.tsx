"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { ChevronDown, Film, LayoutDashboard, LogOut, Menu, Ticket, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logout } from "@/lib/api";
import { useMounted, useSession } from "@/lib/hooks";
import { LinkButton } from "./ui";

const nav = [
  { href: "/", label: "Trang chủ" },
  { href: "/movies", label: "Phim" },
  { href: "/showtimes", label: "Lịch chiếu" },
  { href: "/tickets", label: "Vé của tôi" },
];

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg shadow-brand-500/30 transition group-hover:rotate-[-6deg]">
        <Film className="size-5 text-white" />
      </span>
      <span className="text-lg font-black tracking-tight text-white">
        CINE<span className="text-brand-400">VIET</span>
      </span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const mounted = useMounted();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Đổi trang thì đóng menu (đặt trong handler điều hướng thay vì effect theo pathname cho gọn)
  const closeAll = () => {
    setOpen(false);
    setMenu(false);
  };

  useEffect(() => {
    if (!menu) return;
    const onClick = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menu]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const onLogout = async () => {
    closeAll();
    await logout();
    queryClient.removeQueries({ queryKey: ["reservations"] });
    queryClient.removeQueries({ queryKey: ["reservation"] });
    toast.success("Đã đăng xuất");
    router.push("/");
  };

  const user = mounted ? session?.user : undefined;
  const initials = user?.fullName
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled || open ? "border-b border-ink-700/70 bg-ink-950/85 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive(item.href) ? "text-white" : "text-ink-400 hover:text-white",
                )}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brand-500" />
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {!mounted ? (
            <div className="h-9 w-28" />
          ) : user ? (
            <div ref={menuRef} className="relative hidden md:block">
              <button
                onClick={() => setMenu((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-ink-700 bg-ink-850 py-1 pl-1 pr-3 text-sm transition hover:border-ink-500"
              >
                <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-brand-500 text-[11px] font-bold text-white">
                  {initials}
                </span>
                <span className="max-w-[140px] truncate font-medium text-ink-100">{user.fullName}</span>
                <ChevronDown className={clsx("size-4 text-ink-400 transition", menu && "rotate-180")} />
              </button>
              {menu && (
                <div className="absolute right-0 top-12 w-60 animate-fade-up overflow-hidden rounded-2xl border border-ink-700 bg-ink-850 p-1.5 shadow-2xl">
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-white">{user.fullName}</p>
                    <p className="truncate text-xs text-ink-400">{user.email}</p>
                  </div>
                  <div className="my-1 h-px bg-ink-700" />
                  <MenuLink href="/tickets" icon={<Ticket className="size-4" />} onClick={closeAll}>
                    Vé của tôi
                  </MenuLink>
                  {user.role === "Admin" && (
                    <MenuLink href="/admin" icon={<LayoutDashboard className="size-4" />} onClick={closeAll}>
                      Trang quản trị
                    </MenuLink>
                  )}
                  <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-brand-300 transition hover:bg-ink-700"
                  >
                    <LogOut className="size-4" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <LinkButton href={`/login?next=${encodeURIComponent(pathname)}`} variant="ghost" size="sm">
                Đăng nhập
              </LinkButton>
              <LinkButton href="/register" size="sm">
                Đăng ký
              </LinkButton>
            </div>
          )}

          <button
            className="rounded-xl p-2 text-ink-300 transition hover:bg-ink-800 hover:text-white md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Mở menu"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <div className="animate-fade-in border-t border-ink-700/70 px-4 pb-5 pt-3 md:hidden">
          <nav className="grid gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeAll}
                className={clsx(
                  "rounded-xl px-3 py-3 text-base font-medium",
                  isActive(item.href) ? "bg-brand-500/10 text-brand-300" : "text-ink-300",
                )}
              >
                {item.label}
              </Link>
            ))}
            {user?.role === "Admin" && (
              <Link href="/admin" onClick={closeAll} className="rounded-xl px-3 py-3 text-base font-medium text-gold-300">
                Trang quản trị
              </Link>
            )}
          </nav>
          <div className="mt-3 border-t border-ink-700/70 pt-4">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user.fullName}</p>
                  <p className="truncate text-xs text-ink-400">{user.email}</p>
                </div>
                <button onClick={onLogout} className="flex items-center gap-1.5 text-sm font-medium text-brand-300">
                  <LogOut className="size-4" /> Đăng xuất
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <LinkButton href="/login" variant="outline" className="w-full">
                  Đăng nhập
                </LinkButton>
                <LinkButton href="/register" className="w-full">
                  Đăng ký
                </LinkButton>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-300 transition hover:bg-ink-700 hover:text-white">
      {icon}
      {children}
    </Link>
  );
}
