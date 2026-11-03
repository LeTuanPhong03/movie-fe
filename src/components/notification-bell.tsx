"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import clsx from "clsx";
import { AlertTriangle, Bell, CheckCircle2, Info, Trash2, XCircle } from "lucide-react";
import { notifications, type NoticeType } from "@/lib/notify";

const icons: Record<NoticeType, { icon: typeof Bell; className: string }> = {
  success: { icon: CheckCircle2, className: "text-emerald-400" },
  error: { icon: XCircle, className: "text-brand-400" },
  warning: { icon: AlertTriangle, className: "text-gold-400" },
  info: { icon: Info, className: "text-sky-400" },
};

const timeFmt = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

/** Chuông ở header: số thông báo chưa đọc + danh sách các toast đã hiện (mới nhất trên cùng). */
export function NotificationBell() {
  const { items, seenAt } = useSyncExternalStore(notifications.subscribe, notifications.get, notifications.getServer);
  const [open, setOpen] = useState(false);
  // Mốc "đã xem" lúc vừa mở: giữ để tô sáng các thông báo mới trong lần mở này, dù kho đã đánh dấu đã xem
  const [openedSeenAt, setOpenedSeenAt] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => n.at > seenAt).length;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      setOpenedSeenAt(seenAt);
      notifications.markSeen();
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="relative grid size-9 place-items-center rounded-full border border-ink-700 bg-ink-850 text-ink-300 transition hover:border-ink-500 hover:text-white"
        aria-label={unread ? `Thông báo, ${unread} chưa đọc` : "Thông báo"}
        aria-expanded={open}
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-4.5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold leading-4.5 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] animate-fade-up overflow-hidden rounded-2xl border border-ink-700 bg-ink-850 shadow-2xl">
          <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
            <p className="text-sm font-bold text-white">Thông báo</p>
            {items.length > 0 && (
              <button onClick={() => notifications.clear()} className="flex items-center gap-1 text-xs text-ink-400 hover:text-white">
                <Trash2 className="size-3.5" /> Xoá tất cả
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-400">Chưa có thông báo nào.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-ink-800 overflow-y-auto">
              {items.map((n) => {
                const { icon: Icon, className } = icons[n.type];
                return (
                  <li key={n.id} className={clsx("flex gap-3 px-4 py-3", n.at > openedSeenAt && "bg-ink-800/60")}>
                    <Icon className={clsx("mt-0.5 size-4 shrink-0", className)} />
                    <div className="min-w-0">
                      <p className="text-sm leading-snug text-ink-100">{n.message}</p>
                      <p className="mt-1 text-[11px] text-ink-500">{timeFmt.format(n.at)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
