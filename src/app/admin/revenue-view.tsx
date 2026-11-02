"use client";

import { useState } from "react";
import clsx from "clsx";
import { BarChart3, Receipt, Ticket, Wallet } from "lucide-react";
import { useRevenue } from "@/lib/queries";
import { useToday } from "@/lib/hooks";
import { addDays, formatMoney } from "@/lib/format";
import type { RevenueGroupBy } from "@/lib/types";
import { EmptyState, ErrorState, inputClass, Skeleton } from "@/components/ui";

const presets = [
  { label: "7 ngày", days: 7 },
  { label: "30 ngày", days: 30 },
  { label: "90 ngày", days: 90 },
];

export function RevenueView() {
  const today = useToday();
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [groupBy, setGroupBy] = useState<RevenueGroupBy>("Day");
  // Mặc định 7 ngày gần nhất tính đến hôm nay (giờ VN)
  const from = range?.from ?? (today ? addDays(today, -6) : null);
  const to = range?.to ?? today;
  const { data, isPending, error, refetch, isFetching } = useRevenue(from, to, groupBy);

  const max = Math.max(1, ...(data?.rows.map((r) => r.revenue) ?? [0]));

  return (
    <div className="space-y-6">
      {/* Bộ lọc */}
      <div className="flex flex-col gap-3 rounded-2xl border border-ink-700 bg-ink-900/70 p-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-400">Từ ngày</span>
            <input type="date" className={inputClass} value={from ?? ""} max={to ?? undefined} onChange={(e) => to && setRange({ from: e.target.value, to })} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-400">Đến ngày</span>
            <input type="date" className={inputClass} value={to ?? ""} min={from ?? undefined} onChange={(e) => from && setRange({ from, to: e.target.value })} />
          </label>
          <div className="col-span-2 flex gap-1.5">
            {presets.map((p) => (
              <button
                key={p.days}
                onClick={() => today && setRange({ from: addDays(today, -(p.days - 1)), to: today })}
                className="h-11 rounded-xl bg-ink-800 px-3 text-xs font-medium text-ink-300 transition hover:bg-ink-700 hover:text-white"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex rounded-xl bg-ink-800 p-1">
          {(["Day", "Movie"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={clsx(
                "h-9 flex-1 rounded-lg px-4 text-sm font-medium transition",
                groupBy === g ? "bg-brand-500 text-white shadow" : "text-ink-400 hover:text-white",
              )}
            >
              {g === "Day" ? "Theo ngày" : "Theo phim"}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
          <Skeleton className="h-72 sm:col-span-3" />
        </div>
      ) : (
        <div className={clsx("space-y-6 transition-opacity", isFetching && "opacity-70")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat icon={<Wallet />} label="Doanh thu" value={formatMoney(data.totalRevenue)} accent />
            <Stat icon={<Receipt />} label="Đơn đã thanh toán" value={data.totalReservations.toLocaleString("vi-VN")} />
            <Stat icon={<Ticket />} label="Vé bán ra" value={data.totalTickets.toLocaleString("vi-VN")} />
          </div>

          <div className="rounded-2xl border border-ink-700 bg-ink-900/70 p-5">
            <h2 className="mb-5 font-bold text-white">{groupBy === "Day" ? "Doanh thu theo ngày" : "Doanh thu theo phim"}</h2>
            {data.rows.length === 0 ? (
              <EmptyState icon={<BarChart3 className="size-6" />} title="Chưa có doanh thu trong khoảng này" description="Chỉ tính các đơn đã thanh toán (Confirmed)." />
            ) : groupBy === "Day" ? (
              <div className="no-scrollbar overflow-x-auto">
                <div className="flex h-64 min-w-full items-end gap-2" style={{ width: Math.max(data.rows.length * 44, 100) }}>
                  {data.rows.map((r) => (
                    <div key={r.key} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
                      <span className="pointer-events-none absolute -top-1 z-10 whitespace-nowrap rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-ink-950 opacity-0 shadow transition group-hover:opacity-100">
                        {formatMoney(r.revenue)} · {r.tickets} vé
                      </span>
                      <div
                        className="w-full min-w-6 max-w-12 rounded-t-lg bg-gradient-to-t from-brand-700 to-brand-400 transition-all duration-500 group-hover:from-brand-500 group-hover:to-gold-400"
                        style={{ height: `${Math.max(2, (r.revenue / max) * 85)}%` }}
                      />
                      <span className="text-[10px] text-ink-400">{r.key.slice(8, 10)}/{r.key.slice(5, 7)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {data.rows.map((r) => (
                  <div key={r.movieId ?? r.key}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-white">{r.key}</span>
                      <span className="shrink-0 text-ink-400">
                        <b className="text-gold-400">{formatMoney(r.revenue)}</b> · {r.tickets} vé
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-ink-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-gold-400 transition-all duration-700" style={{ width: `${(r.revenue / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {data.rows.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-ink-700">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-850 text-xs uppercase tracking-wider text-ink-400">
                  <tr>
                    <th className="px-4 py-3">{groupBy === "Day" ? "Ngày" : "Phim"}</th>
                    <th className="px-4 py-3 text-right">Đơn</th>
                    <th className="px-4 py-3 text-right">Vé</th>
                    <th className="px-4 py-3 text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800">
                  {data.rows.map((r) => (
                    <tr key={r.movieId ?? r.key} className="hover:bg-ink-850/60">
                      <td className="px-4 py-3 font-medium text-white">{groupBy === "Day" ? r.key.split("-").reverse().join("/") : r.key}</td>
                      <td className="px-4 py-3 text-right text-ink-300">{r.reservations}</td>
                      <td className="px-4 py-3 text-right text-ink-300">{r.tickets}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gold-400">{formatMoney(r.revenue)}</td>
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

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border p-5",
        accent ? "border-brand-500/30 bg-gradient-to-br from-brand-500/20 to-ink-900" : "border-ink-700 bg-ink-900/70",
      )}
    >
      <div className="flex items-center gap-2 text-sm text-ink-400 [&>svg]:size-4">
        {icon} {label}
      </div>
      <p className="mt-2 text-2xl font-black text-white sm:text-3xl">{value}</p>
    </div>
  );
}
