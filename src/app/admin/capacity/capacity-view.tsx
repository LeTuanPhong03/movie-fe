"use client";

import { useState } from "react";
import clsx from "clsx";
import { Armchair, Gauge } from "lucide-react";
import { useCapacity } from "@/lib/queries";
import { useToday } from "@/lib/hooks";
import { addDays, formatDateTime } from "@/lib/format";
import { EmptyState, ErrorState, inputClass, Skeleton } from "@/components/ui";

// BE giới hạn khoảng báo cáo công suất 31 ngày
const MAX_DAYS = 31;

export function CapacityView() {
  const today = useToday();
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  // Mặc định 7 ngày tới: công suất có ích nhất cho các suất sắp chiếu
  const from = range?.from ?? today;
  const to = range?.to ?? (today ? addDays(today, 6) : null);
  const { data, isPending, error, refetch, isFetching } = useCapacity(from, to);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-ink-700 bg-ink-900/70 p-4 sm:flex sm:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-400">Từ ngày</span>
          <input type="date" className={inputClass} value={from ?? ""} max={to ?? undefined} onChange={(e) => to && setRange({ from: e.target.value, to })} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-400">Đến ngày</span>
          <input
            type="date"
            className={inputClass}
            value={to ?? ""}
            min={from ?? undefined}
            max={from ? addDays(from, MAX_DAYS - 1) : undefined}
            onChange={(e) => from && setRange({ from, to: e.target.value })}
          />
        </label>
        <p className="col-span-2 text-xs text-ink-500 sm:pb-3">Tối đa {MAX_DAYS} ngày · tính theo giờ bắt đầu suất (giờ VN)</p>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : isPending ? (
        <Skeleton className="h-72" />
      ) : (
        <div className={clsx("space-y-6 transition-opacity", isFetching && "opacity-70")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Tỉ lệ lấp đầy" value={`${data.occupancyPercent}%`} accent />
            <Stat label="Ghế đã bán" value={data.bookedSeats.toLocaleString("vi-VN")} />
            <Stat label="Tổng ghế" value={data.totalSeats.toLocaleString("vi-VN")} />
          </div>

          {data.rows.length === 0 ? (
            <EmptyState icon={<Gauge className="size-6" />} title="Không có suất chiếu trong khoảng này" />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-ink-700">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-ink-850 text-xs uppercase tracking-wider text-ink-400">
                  <tr>
                    <th className="px-4 py-3">Suất</th>
                    <th className="px-4 py-3">Phim · Phòng</th>
                    <th className="px-4 py-3">Lấp đầy</th>
                    <th className="px-4 py-3 text-right">Bán / Giữ / Trống</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800">
                  {data.rows.map((r) => (
                    <tr key={r.showtimeId} className="hover:bg-ink-850/60">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-white">{formatDateTime(r.startAt)}</td>
                      <td className="px-4 py-3">
                        <p className="text-ink-100">{r.movieTitle}</p>
                        <p className="text-xs text-ink-500">{r.theaterName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-ink-800">
                            <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-gold-400" style={{ width: `${r.occupancyPercent}%` }} />
                          </div>
                          <span className="text-xs text-ink-300">{r.occupancyPercent}%</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-ink-300">
                        <b className="text-emerald-300">{r.bookedSeats}</b> / <span className="text-gold-300">{r.heldSeats}</span> / {r.availableSeats}
                        <span className="ml-1 text-xs text-ink-500">
                          <Armchair className="inline size-3" /> {r.totalSeats}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={clsx("rounded-2xl border p-5", accent ? "border-brand-500/30 bg-gradient-to-br from-brand-500/20 to-ink-900" : "border-ink-700 bg-ink-900/70")}>
      <p className="text-sm text-ink-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-white sm:text-3xl">{value}</p>
    </div>
  );
}
