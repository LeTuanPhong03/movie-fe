"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Film, Search } from "lucide-react";
import { useMovies } from "@/lib/queries";
import { MovieCard, MovieCardSkeleton, movieGridClass } from "@/components/movie-card";
import { Container, EmptyState, ErrorState, inputClass } from "@/components/ui";

export function MoviesView() {
  const { data, isPending, error, refetch } = useMovies();
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState<string | null>(null);

  const movies = useMemo(() => data?.items ?? [], [data]);
  const genres = useMemo(() => [...new Set(movies.map((m) => m.genre))].sort(), [movies]);
  const filtered = movies.filter(
    (m) => (!genre || m.genre === genre) && m.title.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <Container className="pt-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Phim đang chiếu</h1>
          <p className="mt-1.5 text-sm text-ink-400">{data ? `${data.totalCount} phim` : "Đang tải…"} · Chọn phim để xem suất chiếu</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên phim…" className={clsx(inputClass, "pl-10")} />
        </div>
      </div>

      {genres.length > 1 && (
        <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {[null, ...genres].map((g) => (
            <button
              key={g ?? "all"}
              onClick={() => setGenre(g)}
              className={clsx(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                genre === g ? "bg-white text-ink-950" : "bg-ink-800 text-ink-300 hover:bg-ink-700 hover:text-white",
              )}
            >
              {g ?? "Tất cả"}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        {error ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : isPending ? (
          <div className={movieGridClass}>
            {Array.from({ length: 10 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Film className="size-6" />} title="Không tìm thấy phim phù hợp" description="Thử từ khoá khác hoặc bỏ lọc thể loại." />
        ) : (
          <div className={movieGridClass}>
            {filtered.map((m, i) => (
              <MovieCard key={m.id} movie={m} index={i} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
