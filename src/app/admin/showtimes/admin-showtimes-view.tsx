"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarX2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useMovies, useShowtimesByDate, useTheaters } from "@/lib/queries";
import { useToday } from "@/lib/hooks";
import { formatMoney, formatTime, vnLocalInputToUtcIso } from "@/lib/format";
import type { ShowtimeDto } from "@/lib/types";
import { DateStrip } from "@/components/date-strip";
import { Button, EmptyState, Field, inputClass, Skeleton } from "@/components/ui";

export function AdminShowtimesView() {
  const queryClient = useQueryClient();
  const movies = useMovies();
  const today = useToday();
  const theaters = useTheaters();
  const [form, setForm] = useState({ movieId: "", theaterId: "", startAt: "", price: "90000" });
  const [viewDay, setViewDay] = useState<string | null>(null);
  const day = viewDay ?? today;
  const list = useShowtimesByDate(day);

  const create = useMutation({
    mutationFn: () =>
      api<ShowtimeDto>("/api/showtimes", {
        method: "POST",
        body: {
          movieId: Number(form.movieId),
          theaterId: Number(form.theaterId),
          // Admin nhập giờ VN; validator BE bắt StartAt là UTC (có "Z")
          startAt: vnLocalInputToUtcIso(form.startAt),
          price: Number(form.price),
        },
      }),
    onSuccess: (s) => {
      toast.success(`Đã tạo suất ${s.title} lúc ${formatTime(s.startAt)}`);
      queryClient.invalidateQueries({ queryKey: ["showtimes"] });
    },
    onError: (e) => toast.error(e.message),
  });
  const err = create.error instanceof ApiError ? create.error : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form
        className="h-fit space-y-4 rounded-2xl border border-ink-700 bg-ink-900/70 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.movieId || !form.theaterId || !form.startAt) {
            toast.error("Chọn phim, phòng và giờ chiếu");
            return;
          }
          create.mutate();
        }}
      >
        <h2 className="font-bold text-white">Tạo suất chiếu</h2>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-300">Phim</span>
          <select className={inputClass} value={form.movieId} onChange={(e) => setForm({ ...form, movieId: e.target.value })}>
            <option value="">— Chọn phim —</option>
            {movies.data?.items.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.durationMinutes}′)
              </option>
            ))}
          </select>
          {err?.fieldError("MovieId") && <span className="mt-1.5 block text-xs text-brand-300">{err.fieldError("MovieId")}</span>}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-300">Phòng chiếu</span>
          <select className={inputClass} value={form.theaterId} onChange={(e) => setForm({ ...form, theaterId: e.target.value })}>
            <option value="">— Chọn phòng —</option>
            {theaters.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.totalSeats} ghế)
              </option>
            ))}
          </select>
          {err?.fieldError("TheaterId") && <span className="mt-1.5 block text-xs text-brand-300">{err.fieldError("TheaterId")}</span>}
        </label>
        <Field
          label="Giờ bắt đầu (giờ Việt Nam)"
          name="startAt"
          type="datetime-local"
          value={form.startAt}
          onChange={(e) => setForm({ ...form, startAt: e.target.value })}
          error={err?.fieldError("StartAt")}
        />
        <Field label="Giá vé (VNĐ)" name="price" type="number" min={1000} step={1000} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} error={err?.fieldError("Price")} />
        <Button type="submit" className="w-full" loading={create.isPending}>
          Tạo suất chiếu
        </Button>
        <p className="text-xs leading-relaxed text-ink-500">BE tự tính giờ kết thúc = giờ bắt đầu + thời lượng phim + 15 phút dọn phòng, và chặn trùng giờ trong cùng phòng (409).</p>
      </form>

      <div className="min-w-0 rounded-2xl border border-ink-700 bg-ink-900/70 p-5">
        <h2 className="mb-4 font-bold text-white">Suất chiếu sắp tới</h2>
        <DateStrip today={today} value={day} onChange={setViewDay} />
        <div className="mt-5">
          {list.isPending || !day ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : (list.data ?? []).length === 0 ? (
            <EmptyState icon={<CalendarX2 className="size-6" />} title="Không có suất nào (chưa chiếu) trong ngày" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-ink-400">
                  <tr>
                    <th className="py-2 pr-4">Giờ</th>
                    <th className="py-2 pr-4">Phim</th>
                    <th className="py-2 pr-4">Phòng</th>
                    <th className="py-2 text-right">Giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800">
                  {list.data!.map((s) => (
                    <tr key={s.id}>
                      <td className="whitespace-nowrap py-3 pr-4 font-bold text-white">
                        {formatTime(s.startAt)} <span className="font-normal text-ink-500">– {formatTime(s.movieEndAt)}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <Link href={`/booking/${s.id}`} className="text-ink-100 hover:text-brand-300">
                          {s.title}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-ink-400">{s.theaterName}</td>
                      <td className="whitespace-nowrap py-3 text-right text-gold-400">{formatMoney(s.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
