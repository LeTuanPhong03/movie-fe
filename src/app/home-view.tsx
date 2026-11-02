"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, CalendarDays, Clock, CreditCard, Film, ShieldCheck, Timer } from "lucide-react";
import { useMovieLookup, useMovies, useShowtimesByDate } from "@/lib/queries";
import { useNow, useToday } from "@/lib/hooks";
import { ageRating, formatDuration, formatMoney, formatTime, parseUtc } from "@/lib/format";
import type { MovieDto } from "@/lib/types";
import { Poster, posterGradient } from "@/components/poster";
import { MovieCard, MovieCardSkeleton, movieGridClass } from "@/components/movie-card";
import { Container, EmptyState, ErrorState, LinkButton, SectionTitle, Skeleton } from "@/components/ui";

export function HomeView() {
  const { data, isPending, error, refetch } = useMovies();
  const movies = data?.items ?? [];

  return (
    <>
      <Hero movies={movies} loading={isPending} />
      <Container className="mt-14 space-y-16">
        <section>
          <SectionTitle
            action={
              <Link href="/movies" className="flex items-center gap-1 text-sm font-medium text-ink-400 hover:text-white">
                Xem tất cả <ArrowRight className="size-4" />
              </Link>
            }
          >
            Phim đang chiếu
          </SectionTitle>
          {error ? (
            <ErrorState message={error.message} onRetry={() => refetch()} />
          ) : isPending ? (
            <div className={movieGridClass}>
              {Array.from({ length: 5 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          ) : movies.length === 0 ? (
            <EmptyState icon={<Film className="size-6" />} title="Chưa có phim nào đang chiếu" />
          ) : (
            <div className={movieGridClass}>
              {movies.slice(0, 10).map((m, i) => (
                <MovieCard key={m.id} movie={m} index={i} />
              ))}
            </div>
          )}
        </section>

        <TodayShowtimes />
        <Features />
      </Container>
    </>
  );
}

// ─── Banner phim nổi bật, tự chuyển 7 giây/lần ─────────────────────
function Hero({ movies, loading }: { movies: MovieDto[]; loading: boolean }) {
  const featured = movies.slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (featured.length < 2 || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % featured.length), 7000);
    return () => clearInterval(id);
  }, [featured.length, paused]);

  if (loading) {
    return (
      <Container className="pt-6">
        <Skeleton className="h-[440px] rounded-3xl sm:h-[480px]" />
      </Container>
    );
  }
  if (featured.length === 0) return null;
  const movie = featured[index % featured.length];
  const rating = ageRating(movie.suitableAge);

  return (
    <Container className="pt-4 sm:pt-6">
      <section
        className="relative overflow-hidden rounded-3xl border border-white/5"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Nền: poster phóng to + làm mờ */}
        <HeroBackdrop key={movie.id} title={movie.title} posterUrl={movie.posterUrl} />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-ink-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />

        <div className="relative grid min-h-[440px] items-center gap-8 p-6 sm:min-h-[480px] sm:p-10 md:grid-cols-[1fr_auto] lg:p-14">
          <div key={movie.id} className="max-w-xl animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gold-300 ring-1 ring-white/10 backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-gold-400" /> Đang chiếu
            </span>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">{movie.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2.5 text-sm text-ink-300">
              <span className={clsx("rounded-md px-1.5 py-0.5 text-xs font-black", rating.className)}>{rating.label}</span>
              <span>{movie.genre}</span>
              <span className="size-1 rounded-full bg-ink-500" />
              <span className="flex items-center gap-1">
                <Clock className="size-4" /> {formatDuration(movie.durationMinutes)}
              </span>
            </div>
            {movie.description && <p className="mt-4 line-clamp-3 text-base leading-relaxed text-ink-300">{movie.description}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href={`/movies/${movie.id}`} size="lg">
                Đặt vé ngay
              </LinkButton>
              <LinkButton href="/showtimes" variant="outline" size="lg" className="bg-black/20 backdrop-blur">
                <CalendarDays className="size-5" /> Lịch chiếu
              </LinkButton>
            </div>
          </div>

          <Link href={`/movies/${movie.id}`} key={`p-${movie.id}`} className="hidden w-56 animate-fade-up md:block lg:w-64">
            <Poster
              title={movie.title}
              posterUrl={movie.posterUrl}
              genre={movie.genre}
              suitableAge={movie.suitableAge}
              className="rotate-2 shadow-2xl shadow-black/60 ring-1 ring-white/10 transition duration-500 hover:rotate-0"
            />
          </Link>

          {featured.length > 1 && (
            <div className="absolute bottom-5 left-6 flex gap-2 sm:left-10 lg:left-14">
              {featured.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Phim ${i + 1}`}
                  className={clsx(
                    "h-1.5 rounded-full transition-all duration-500",
                    i === index % featured.length ? "w-8 bg-brand-500" : "w-3 bg-white/25 hover:bg-white/50",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </Container>
  );
}

function HeroBackdrop({ title, posterUrl }: { title: string; posterUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="absolute inset-0 animate-fade-in">
      {posterUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={posterUrl} alt="" onError={() => setFailed(true)} className="size-full scale-110 object-cover opacity-50 blur-2xl" />
      ) : (
        <div className="size-full opacity-80" style={{ background: posterGradient(title) }} />
      )}
    </div>
  );
}

// ─── Suất chiếu sắp tới hôm nay ────────────────────────────────────
function TodayShowtimes() {
  const today = useToday();
  const now = useNow(30_000);
  const { data, isPending } = useShowtimesByDate(today);
  const lookup = useMovieLookup();

  const upcoming = useMemo(
    () => (data ?? []).filter((s) => now === null || parseUtc(s.startAt).getTime() > now).slice(0, 12),
    [data, now],
  );

  return (
    <section>
      <SectionTitle
        action={
          <Link href="/showtimes" className="flex items-center gap-1 text-sm font-medium text-ink-400 hover:text-white">
            Lịch đầy đủ <ArrowRight className="size-4" />
          </Link>
        }
      >
        Suất chiếu hôm nay
      </SectionTitle>
      {isPending || !today ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-60 shrink-0" />
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-6" />}
          title="Hôm nay đã hết suất chiếu"
          description="Xem lịch các ngày tiếp theo để chọn suất phù hợp."
          action={<LinkButton href="/showtimes" variant="outline">Xem lịch chiếu</LinkButton>}
        />
      ) : (
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {upcoming.map((s, i) => {
            const movie = lookup.get(s.movieId);
            return (
              <Link
                key={s.id}
                href={`/booking/${s.id}`}
                className="group flex w-64 shrink-0 animate-fade-up snap-start gap-3 rounded-2xl border border-ink-700 bg-ink-850 p-3 transition hover:border-brand-500/60 hover:bg-ink-800"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <Poster title={s.title} posterUrl={movie?.posterUrl} showBadge={false} className="w-16 shrink-0 rounded-xl" />
                <div className="flex min-w-0 flex-col justify-between py-0.5">
                  <div>
                    <p className="line-clamp-1 text-sm font-bold text-white">{s.title}</p>
                    <p className="mt-0.5 text-xs text-ink-400">{s.theaterName}</p>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <span className="text-2xl font-black text-white transition group-hover:text-brand-300">{formatTime(s.startAt)}</span>
                    <span className="pb-1 text-xs font-semibold text-gold-400">{formatMoney(s.price)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Features() {
  const items = [
    { icon: <Timer className="size-6" />, title: "Giữ ghế 10 phút", text: "Chọn ghế xong là ghế thuộc về bạn trong 10 phút để thanh toán." },
    { icon: <ShieldCheck className="size-6" />, title: "Không trùng ghế", text: "Hai người không bao giờ mua được cùng một ghế, kể cả bấm cùng lúc." },
    { icon: <CreditCard className="size-6" />, title: "Thanh toán VNPay", text: "Thanh toán an toàn qua cổng VNPay, vé xác nhận ngay sau khi trả tiền." },
  ];
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {items.map((f) => (
        <div key={f.title} className="rounded-2xl border border-ink-700 bg-gradient-to-br from-ink-850 to-ink-900 p-6">
          <div className="grid size-12 place-items-center rounded-xl bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/20">{f.icon}</div>
          <h3 className="mt-4 font-bold text-white">{f.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-400">{f.text}</p>
        </div>
      ))}
    </section>
  );
}
