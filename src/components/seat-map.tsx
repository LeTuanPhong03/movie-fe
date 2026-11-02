"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import type { SeatStatusDto } from "@/lib/types";

/** Lối đi giữa các khối ghế, giống rạp thật: hàng ≥ 8 ghế thì chừa lối sau ghế thứ 2 và trước 2 ghế cuối. */
function hasAisleAfter(number: number, perRow: number) {
  return perRow >= 8 && (number === 2 || number === perRow - 2);
}

export function SeatMap({
  seats,
  selected,
  onToggle,
  disabled,
}: {
  seats: SeatStatusDto[];
  selected: Set<number>;
  onToggle: (seat: SeatStatusDto) => void;
  disabled?: boolean;
}) {
  const rows = new Map<string, SeatStatusDto[]>();
  for (const s of seats) rows.set(s.row, [...(rows.get(s.row) ?? []), s]);
  const perRow = Math.max(0, ...[...rows.values()].map((r) => r.length));

  // Màn hình hẹp hơn sơ đồ (mobile): cuộn sẵn vào giữa để khách thấy màn chiếu và ghế trung tâm trước
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [perRow]);

  return (
    <div ref={scroller} className="no-scrollbar overflow-x-auto pb-2">
      <div className="mx-auto w-max px-2">
        {/* Màn hình */}
        <div className="mx-auto mb-10 w-[90%]">
          <div className="screen-curve" />
          <p className="-mt-8 text-center text-xs font-semibold uppercase tracking-[0.4em] text-ink-400">Màn hình</p>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          {[...rows.entries()].map(([row, list]) => (
            <div key={row} className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-5 text-center text-xs font-bold text-ink-500">{row}</span>
              <div className="flex gap-1 sm:gap-1.5">
                {list.map((seat) => {
                  const isSelected = selected.has(seat.id);
                  const taken = seat.status !== "Available";
                  return (
                    <div key={seat.id} className={clsx("flex", hasAisleAfter(seat.number, perRow) && "mr-3 sm:mr-5")}>
                      <button
                        type="button"
                        disabled={taken || disabled}
                        onClick={() => onToggle(seat)}
                        title={`Ghế ${seat.row}${seat.number}${seat.status === "Held" ? " · đang được giữ" : seat.status === "Booked" ? " · đã bán" : ""}`}
                        aria-pressed={isSelected}
                        className={clsx(
                          "relative grid size-7 place-items-center rounded-t-lg rounded-b-md text-[10px] font-bold transition-all duration-150 sm:size-8 lg:size-9 lg:text-[11px]",
                          isSelected
                            ? "animate-pop bg-brand-500 text-white shadow-lg shadow-brand-500/40 ring-2 ring-brand-300/60"
                            : seat.status === "Booked"
                              ? "cursor-not-allowed bg-ink-700/60 text-ink-500"
                              : seat.status === "Held"
                                ? "cursor-not-allowed bg-gold-500/20 text-gold-400/70 ring-1 ring-gold-500/30"
                                : "bg-ink-800 text-ink-300 ring-1 ring-ink-600 hover:-translate-y-0.5 hover:bg-ink-700 hover:text-white hover:ring-brand-400",
                        )}
                      >
                        {seat.status === "Booked" ? <X className="size-3.5" /> : seat.number}
                      </button>
                    </div>
                  );
                })}
              </div>
              <span className="w-5 text-center text-xs font-bold text-ink-500">{row}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SeatLegend() {
  const items = [
    { label: "Ghế trống", className: "bg-ink-800 ring-1 ring-ink-600" },
    { label: "Đang chọn", className: "bg-brand-500" },
    { label: "Người khác đang giữ", className: "bg-gold-500/20 ring-1 ring-gold-500/30" },
    { label: "Đã bán", className: "bg-ink-700/60" },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-2 text-xs text-ink-400">
          <span className={clsx("size-4 rounded-t-md rounded-b-sm", i.className)} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
