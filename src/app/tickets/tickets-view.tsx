"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Ticket } from "lucide-react";
import { useMyReservations } from "@/lib/queries";
import { formatDate, formatMoney, formatTime, formatWeekday } from "@/lib/format";
import type { ReservationDto, ReservationStatus } from "@/lib/types";
import { seatLabel } from "@/components/reservation-summary";
import { Container, EmptyState, ErrorState, LinkButton, Skeleton, StatusBadge } from "@/components/ui";

const tabs: { value?: ReservationStatus; label: string }[] = [
  { label: "Tất cả" },
  { value: "Pending", label: "Chờ thanh toán" },
  { value: "Confirmed", label: "Đã thanh toán" },
  { value: "Cancelled", label: "Đã huỷ" },
  { value: "Expired", label: "Hết hạn" },
];

export function TicketsView() {
  const [status, setStatus] = useState<ReservationStatus | undefined>();
  const [page, setPage] = useState(1);
  const { data, isPending, error, refetch, isPlaceholderData } = useMyReservations(status, page, true);

  return (
    <Container className="max-w-4xl pt-8">
      <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Vé của tôi</h1>
      <p className="mt-1.5 text-sm text-ink-400">Lịch sử đặt vé, mới nhất trước.</p>

      <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t.label}
            onClick={() => {
              setStatus(t.value);
              setPage(1);
            }}
            className={clsx(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
              status === t.value ? "bg-white text-ink-950" : "bg-ink-800 text-ink-300 hover:bg-ink-700 hover:text-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={clsx("mt-6 space-y-3 transition-opacity", isPlaceholderData && "opacity-60")}>
        {error ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : isPending ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={<Ticket className="size-6" />}
            title={status ? "Không có đơn nào ở trạng thái này" : "Bạn chưa đặt vé nào"}
            description="Chọn một bộ phim và đặt vé ngay thôi!"
            action={<LinkButton href="/movies">Đặt vé</LinkButton>}
          />
        ) : (
          data.items.map((r, i) => <TicketRow key={r.id} reservation={r} index={i} />)
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <PageButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="size-4" />
          </PageButton>
          <span className="text-sm text-ink-400">
            Trang <b className="text-white">{data.page}</b> / {data.totalPages}
          </span>
          <PageButton disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="size-4" />
          </PageButton>
        </div>
      )}
    </Container>
  );
}

function TicketRow({ reservation: r, index }: { reservation: ReservationDto; index: number }) {
  const href = r.status === "Pending" ? `/checkout/${r.id}` : `/tickets/${r.id}`;
  const dim = r.status === "Cancelled" || r.status === "Expired";
  return (
    <Link
      href={href}
      className={clsx(
        "group flex animate-fade-up overflow-hidden rounded-2xl border border-ink-700 bg-ink-850 transition hover:border-ink-500",
        dim && "opacity-70 hover:opacity-100",
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Cuống vé: ngày giờ */}
      <div
        className={clsx(
          "flex w-24 shrink-0 flex-col items-center justify-center border-r border-dashed border-ink-600 px-2 py-4 text-center sm:w-32",
          r.status === "Confirmed" ? "bg-gradient-to-b from-brand-500/20 to-transparent" : "bg-ink-800/60",
        )}
      >
        <span className="text-[11px] text-ink-400">{formatWeekday(r.startAt)}</span>
        <span className="text-2xl font-black text-white sm:text-3xl">{formatTime(r.startAt)}</span>
        <span className="text-[11px] text-ink-400">{formatDate(r.startAt)}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 font-bold text-white group-hover:text-brand-300">{r.movieTitle}</h3>
            <p className="mt-0.5 text-xs text-ink-400">
              {r.theaterName} · Ghế {seatLabel(r.seats)}
            </p>
          </div>
          <StatusBadge status={r.status} />
        </div>
        <div className="flex items-end justify-between gap-3">
          <span className="text-xs text-ink-500">#{r.id.toString().padStart(6, "0")}</span>
          <div className="text-right">
            <span className="block text-base font-black text-gold-400">{formatMoney(r.totalPrice)}</span>
            {r.status === "Pending" && <span className="text-xs font-semibold text-brand-300">Tiếp tục thanh toán →</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

function PageButton({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="grid size-10 place-items-center rounded-xl border border-ink-600 text-ink-300 transition hover:bg-ink-800 hover:text-white disabled:opacity-30"
      {...rest}
    >
      {children}
    </button>
  );
}
