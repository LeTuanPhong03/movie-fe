"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { keys, useTheaters } from "@/lib/queries";
import type { TheaterDto } from "@/lib/types";
import { Button, Field, LinkButton, Skeleton } from "@/components/ui";

export function AdminTheatersView() {
  const queryClient = useQueryClient();
  const theaters = useTheaters();
  const [form, setForm] = useState({ name: "", rows: "8", seatsPerRow: "10" });
  const [created, setCreated] = useState<TheaterDto | null>(null);
  const rows = Math.min(26, Math.max(0, Number(form.rows) || 0));
  const perRow = Math.min(50, Math.max(0, Number(form.seatsPerRow) || 0));

  const create = useMutation({
    mutationFn: () =>
      api<TheaterDto>("/api/theaters", { method: "POST", body: { name: form.name.trim(), rows: Number(form.rows), seatsPerRow: Number(form.seatsPerRow) } }),
    onSuccess: (t) => {
      queryClient.invalidateQueries({ queryKey: keys.theaters });
      setCreated(t);
      toast.success(`Đã tạo ${t.name} (Id ${t.id})`);
    },
    onError: (e) => toast.error(e.message),
  });
  const err = create.error instanceof ApiError ? create.error : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-6">
      <form
        className="space-y-4 rounded-2xl border border-ink-700 bg-ink-900/70 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <h2 className="font-bold text-white">Tạo phòng chiếu</h2>
        <Field label="Tên phòng" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={err?.fieldError("Name")} placeholder="Phòng 3" required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Số hàng (A–Z)" name="rows" type="number" min={1} max={26} value={form.rows} onChange={(e) => setForm({ ...form, rows: e.target.value })} error={err?.fieldError("Rows")} />
          <Field label="Ghế mỗi hàng" name="seatsPerRow" type="number" min={1} max={50} value={form.seatsPerRow} onChange={(e) => setForm({ ...form, seatsPerRow: e.target.value })} error={err?.fieldError("SeatsPerRow")} />
        </div>
        <p className="text-sm text-ink-400">
          Tổng: <b className="text-white">{rows * perRow}</b> ghế
        </p>
        <Button type="submit" className="w-full" loading={create.isPending}>
          Tạo phòng
        </Button>
        {created && (
          <div className="animate-fade-up rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-emerald-300">
              <CheckCircle2 className="size-4" /> {created.name} — Id {created.id}
            </p>
            <p className="mt-1 text-ink-300">
              {created.rows} hàng × {created.seatsPerRow} ghế = {created.totalSeats} ghế
            </p>
            <LinkButton href="/admin/showtimes" size="sm" variant="outline" className="mt-3">
              Tạo suất chiếu cho phòng này
            </LinkButton>
          </div>
        )}
      </form>

      <div className="rounded-2xl border border-ink-700 bg-ink-900/70 p-5">
        <h2 className="mb-3 font-bold text-white">Phòng hiện có</h2>
        {theaters.isPending ? (
          <Skeleton className="h-20" />
        ) : (theaters.data ?? []).length === 0 ? (
          <p className="text-sm text-ink-400">Chưa có phòng nào.</p>
        ) : (
          <ul className="divide-y divide-ink-800 text-sm">
            {theaters.data!.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="truncate font-medium text-white">{t.name}</span>
                <span className="shrink-0 text-ink-400">
                  {t.rows} × {t.seatsPerRow} = {t.totalSeats} ghế
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>

      {/* Xem trước sơ đồ */}
      <div className="rounded-2xl border border-ink-700 bg-ink-900/70 p-5">
        <h2 className="mb-6 font-bold text-white">Xem trước sơ đồ</h2>
        <div className="no-scrollbar overflow-x-auto">
          <div className="mx-auto w-max">
            <div className="screen-curve mx-auto mb-6 w-4/5 !h-10" />
            <div className="space-y-1">
              {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex items-center gap-1">
                  <span className="w-4 text-[10px] font-bold text-ink-500">{String.fromCharCode(65 + r)}</span>
                  {Array.from({ length: perRow }).map((_, c) => (
                    <span key={c} className="size-3.5 rounded-t-[4px] rounded-b-[2px] bg-ink-700 sm:size-4" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
