"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { Clapperboard, Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useMovies } from "@/lib/queries";
import { ageRating, formatDuration } from "@/lib/format";
import type { MovieDto, MovieInput } from "@/lib/types";
import { Poster } from "@/components/poster";
import { Button, EmptyState, ErrorState, Field, Modal, Skeleton } from "@/components/ui";

export function AdminMoviesView() {
  const queryClient = useQueryClient();
  const { data, isPending, error, refetch } = useMovies();
  const [editing, setEditing] = useState<MovieDto | "new" | null>(null);
  const [deleting, setDeleting] = useState<MovieDto | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["movies"] });
    queryClient.invalidateQueries({ queryKey: ["movie"] });
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-400">{data ? `${data.totalCount} phim đang chiếu` : "Đang tải…"}</p>
        <Button onClick={() => setEditing("new")}>
          <Plus className="size-4" /> Thêm phim
        </Button>
      </div>

      {error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState icon={<Clapperboard className="size-6" />} title="Chưa có phim" action={<Button onClick={() => setEditing("new")}>Thêm phim đầu tiên</Button>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.items.map((m) => {
            const rating = ageRating(m.suitableAge);
            return (
              <div key={m.id} className="flex gap-4 rounded-2xl border border-ink-700 bg-ink-900/70 p-3 transition hover:border-ink-500">
                <Poster title={m.title} posterUrl={m.posterUrl} showBadge={false} className="w-16 shrink-0 rounded-xl" />
                <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                  <div>
                    <p className="line-clamp-1 font-bold text-white">{m.title}</p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      #{m.id} · {m.genre} · {formatDuration(m.durationMinutes)} ·{" "}
                      <span className={`rounded px-1 text-[10px] font-black ${rating.className}`}>{rating.label}</span>
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => setEditing(m)}>
                      <Pencil className="size-3.5" /> Sửa
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleting(m)}>
                      <Trash2 className="size-3.5" /> Xoá
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <MovieFormModal
          movie={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            invalidate();
            setEditing(null);
          }}
        />
      )}
      {deleting && <DeleteMovieModal movie={deleting} onClose={() => setDeleting(null)} onDeleted={() => { invalidate(); setDeleting(null); }} />}
    </div>
  );
}

function MovieFormModal({ movie, onClose, onSaved }: { movie: MovieDto | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: movie?.title ?? "",
    description: movie?.description ?? "",
    durationMinutes: String(movie?.durationMinutes ?? 120),
    genre: movie?.genre ?? "",
    suitableAge: String(movie?.suitableAge ?? 0),
    posterUrl: movie?.posterUrl ?? "",
  });

  const save = useMutation({
    mutationFn: () => {
      const body: MovieInput = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        durationMinutes: Number(form.durationMinutes),
        genre: form.genre.trim(),
        suitableAge: Number(form.suitableAge),
        posterUrl: form.posterUrl.trim() || null,
      };
      return movie
        ? api<MovieDto>(`/api/movies/${movie.id}`, { method: "PUT", body })
        : api<MovieDto>("/api/movies", { method: "POST", body });
    },
    onSuccess: () => {
      toast.success(movie ? "Đã cập nhật phim" : "Đã thêm phim");
      onSaved();
    },
    onError: (e) => toast.error(e.message),
  });

  const err = save.error instanceof ApiError ? save.error : null;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <Modal open onClose={onClose} title={movie ? `Sửa phim #${movie.id}` : "Thêm phim mới"} size="lg">
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Field className="sm:col-span-2" label="Tên phim" name="title" value={form.title} onChange={set("title")} error={err?.fieldError("Title")} required />
        <Field label="Thể loại" name="genre" value={form.genre} onChange={set("genre")} error={err?.fieldError("Genre")} placeholder="Hành động" required />
        <Field label="Thời lượng (phút)" name="durationMinutes" type="number" min={1} value={form.durationMinutes} onChange={set("durationMinutes")} error={err?.fieldError("DurationMinutes")} required />
        <Field label="Độ tuổi tối thiểu" name="suitableAge" type="number" min={0} value={form.suitableAge} onChange={set("suitableAge")} error={err?.fieldError("SuitableAge")} hint="0 = mọi lứa tuổi (P)" />
        <Field label="Link poster" name="posterUrl" type="url" value={form.posterUrl} onChange={set("posterUrl")} error={err?.fieldError("PosterUrl")} placeholder="https://…" />
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-ink-300">Mô tả</span>
          <textarea
            rows={4}
            value={form.description}
            onChange={set("description")}
            className="w-full rounded-xl border border-ink-600 bg-ink-900 px-3.5 py-2.5 text-sm text-white transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          {err?.fieldError("Description") && <span className="mt-1.5 block text-xs text-brand-300">{err.fieldError("Description")}</span>}
        </label>
        {movie && (
          <p className="text-xs text-ink-500 sm:col-span-2">
            Lưu ý: BE chặn đổi thời lượng nếu phim đã có suất chiếu trong tương lai (tránh trùng giờ phòng).
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" loading={save.isPending}>
            {movie ? "Lưu thay đổi" : "Thêm phim"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteMovieModal({ movie, onClose, onDeleted }: { movie: MovieDto; onClose: () => void; onDeleted: () => void }) {
  const [hard, setHard] = useState(false);
  const del = useMutation({
    mutationFn: () => api(`/api/movies/${movie.id}`, { method: "DELETE", query: { hardDelete: hard } }),
    onSuccess: () => {
      toast.success(hard ? "Đã xoá hẳn phim" : "Đã ẩn phim");
      onDeleted();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Modal open onClose={onClose} title={`Xoá “${movie.title}”?`}>
      <div className="space-y-2">
        {[
          { v: false, t: "Ẩn phim (khuyên dùng)", d: "Phim ngừng hiển thị với khách, lịch sử vé vẫn giữ nguyên." },
          { v: true, t: "Xoá hẳn khỏi hệ thống", d: "Chỉ làm được khi phim chưa từng có suất chiếu." },
        ].map((o) => (
          <label
            key={String(o.v)}
            className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 transition ${hard === o.v ? "border-brand-500 bg-brand-500/10" : "border-ink-600 hover:border-ink-500"}`}
          >
            <input type="radio" className="mt-1 accent-brand-500" checked={hard === o.v} onChange={() => setHard(o.v)} />
            <span>
              <span className="block text-sm font-semibold text-white">{o.t}</span>
              <span className="text-xs text-ink-400">{o.d}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose}>
          Quay lại
        </Button>
        <Button onClick={() => del.mutate()} loading={del.isPending}>
          {hard ? "Xoá hẳn" : "Ẩn phim"}
        </Button>
      </div>
    </Modal>
  );
}
