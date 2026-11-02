"use client";

import { useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { useAdminReservations } from "@/lib/queries";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { ReservationStatus } from "@/lib/types";
import { Button, EmptyState, ErrorState, inputClass, Skeleton, StatusBadge, statusLabel } from "@/components/ui";

const statuses: ReservationStatus[] = ["Pending", "Confirmed", "Cancelled", "Expired"];

export function AdminReservationsView() {
  const [status, setStatus] = useState<ReservationStatus | undefined>();
  const [showtimeId, setShowtimeId] = useState("");
  const [page, setPage] = useState(1);
  const { data, isPending, error, refetch, isFetching } = useAdminReservations({
    status,
    showtimeId: Number(showtimeId) > 0 ? Number(showtimeId) : undefined,
    page,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-ink-700 bg-ink-900/70 p-4 sm:flex sm:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-400">Trạng thái</span>
          <select
            className={inputClass}
            value={status ?? ""}
            onChange={(e) => {
              setStatus((e.target.value || undefined) as ReservationStatus | undefined);
              setPage(1);
            }}
          >
            <option value="">Tất cả</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-400">Id suất chiếu</span>
          <input
            className={inputClass}
            type="number"
            min={1}
            placeholder="Tất cả"
            value={showtimeId}
            onChange={(e) => {
              setShowtimeId(e.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : isPending ? (
        <Skeleton className="h-72" />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<Inbox className="size-6" />} title="Không có đơn nào khớp bộ lọc" />
      ) : (
        <div className={clsx("space-y-4 transition-opacity", isFetching && "opacity-70")}>
          <div className="overflow-x-auto rounded-2xl border border-ink-700">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-ink-850 text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-4 py-3">Đơn</th>
                  <th className="px-4 py-3">Khách</th>
                  <th className="px-4 py-3">Phim · Suất</th>
                  <th className="px-4 py-3">Ghế</th>
                  <th className="px-4 py-3 text-right">Tổng</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {data.items.map(({ userEmail, userFullName, reservation: r }) => (
                  <tr key={r.id} className="hover:bg-ink-850/60">
                    <td className="px-4 py-3 font-bold text-white">#{r.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-ink-100">{userFullName}</p>
                      <p className="text-xs text-ink-500">{userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ink-100">{r.movieTitle}</p>
                      <p className="text-xs text-ink-500">
                        {formatDateTime(r.startAt)} · {r.theaterName} · suất #{r.showtimeId}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ink-300">{r.seats.map((s) => `${s.row}${s.number}`).join(", ")}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gold-400">{formatMoney(r.totalPrice)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} totalPages={data.totalPages} totalCount={data.totalCount} onChange={setPage} />
        </div>
      )}
    </div>
  );
}

export function Pager({ page, totalPages, totalCount, onChange }: { page: number; totalPages: number; totalCount: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-ink-400">
      <span>
        {totalCount.toLocaleString("vi-VN")} kết quả · Trang {page}/{Math.max(1, totalPages)}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Trang trước">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Trang sau">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
