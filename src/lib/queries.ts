"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type {
  AdminReservationDto,
  CapacityReportDto,
  MovieDto,
  PagedResult,
  ReservationDto,
  ReservationStatus,
  RevenueGroupBy,
  RevenueReportDto,
  SeatMapDto,
  ShowtimeDto,
  TheaterDto,
  UserDto,
} from "./types";

// Gom query key một chỗ: mutation biết chính xác key nào cần làm mới (invalidate) sau khi ghi dữ liệu.
export const keys = {
  movies: (page = 1, pageSize = 50) => ["movies", page, pageSize] as const,
  movie: (id: number) => ["movie", id] as const,
  showtimes: (date: string) => ["showtimes", date] as const,
  showtime: (id: number) => ["showtime", id] as const,
  seats: (showtimeId: number) => ["seats", showtimeId] as const,
  reservations: (status?: ReservationStatus, page = 1) => ["reservations", status ?? "all", page] as const,
  reservation: (id: number) => ["reservation", id] as const,
  revenue: (from: string, to: string, groupBy: RevenueGroupBy) => ["revenue", from, to, groupBy] as const,
  capacity: (from: string, to: string) => ["capacity", from, to] as const,
  theaters: ["theaters"] as const,
  users: (search: string, page: number) => ["users", search, page] as const,
  adminReservations: (filter: AdminReservationFilter) => ["admin-reservations", filter] as const,
};

export interface AdminReservationFilter {
  status?: ReservationStatus;
  showtimeId?: number;
  page: number;
}

/** Danh sách phim đang chiếu. pageSize tối đa của BE là 50 — đủ cho một rạp. */
export function useMovies(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: keys.movies(page, pageSize),
    queryFn: () => api<PagedResult<MovieDto>>("/api/movies", { query: { page, pageSize }, auth: false }),
    staleTime: 5 * 60_000,
  });
}

export function useMovie(id: number) {
  return useQuery({
    queryKey: keys.movie(id),
    queryFn: () => api<MovieDto>(`/api/movies/${id}`, { auth: false }),
    staleTime: 5 * 60_000,
  });
}

/**
 * Bảng tra MovieId → phim, để lấy poster, thể loại, độ tuổi cho suất chiếu / đơn.
 * Tra theo Id chứ KHÔNG theo tên: tên phim không unique (hai phim có thể trùng tên).
 */
export function useMovieLookup() {
  const { data } = useMovies();
  const map = new Map<number, MovieDto>();
  data?.items.forEach((m) => map.set(m.id, m));
  return map;
}

export function useShowtimesByDate(date: string | null) {
  return useQuery({
    queryKey: keys.showtimes(date ?? ""),
    queryFn: () => api<ShowtimeDto[]>("/api/showtimes", { query: { date: date! }, auth: false }),
    enabled: !!date,
    staleTime: 60_000,
  });
}

export function useShowtime(id: number) {
  return useQuery({
    queryKey: keys.showtime(id),
    queryFn: () => api<ShowtimeDto>(`/api/showtimes/${id}`, { auth: false }),
    staleTime: 5 * 60_000,
  });
}

/** Sơ đồ ghế tự làm mới 10 giây/lần để thấy ghế người khác vừa giữ — giảm khả năng bấm "Tiếp tục" rồi mới bị 409. */
export function useSeatMap(showtimeId: number) {
  return useQuery({
    queryKey: keys.seats(showtimeId),
    queryFn: () => api<SeatMapDto>(`/api/showtimes/${showtimeId}/seats`, { auth: false }),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function useMyReservations(status: ReservationStatus | undefined, page: number, enabled: boolean) {
  return useQuery({
    queryKey: keys.reservations(status, page),
    queryFn: () => api<PagedResult<ReservationDto>>("/api/reservations", { query: { status, page, pageSize: 8 } }),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function useReservation(id: number, enabled = true) {
  return useQuery({
    queryKey: keys.reservation(id),
    queryFn: () => api<ReservationDto>(`/api/reservations/${id}`),
    enabled,
  });
}

export function useRevenue(from: string | null, to: string | null, groupBy: RevenueGroupBy) {
  return useQuery({
    queryKey: keys.revenue(from ?? "", to ?? "", groupBy),
    queryFn: () => api<RevenueReportDto>("/api/reports/revenue", { query: { from: from!, to: to!, groupBy } }),
    enabled: !!from && !!to,
    placeholderData: (prev) => prev,
  });
}

export function useCapacity(from: string | null, to: string | null) {
  return useQuery({
    queryKey: keys.capacity(from ?? "", to ?? ""),
    queryFn: () => api<CapacityReportDto>("/api/reports/capacity", { query: { from: from!, to: to! } }),
    enabled: !!from && !!to,
    placeholderData: (prev) => prev,
  });
}

/** Mọi phòng chiếu (Admin) — để chọn phòng khi tạo suất, thay cho việc đoán Id. */
export function useTheaters() {
  return useQuery({
    queryKey: keys.theaters,
    queryFn: () => api<TheaterDto[]>("/api/theaters"),
    staleTime: 5 * 60_000,
  });
}

export function useUsers(search: string, page: number) {
  return useQuery({
    queryKey: keys.users(search, page),
    queryFn: () => api<PagedResult<UserDto>>("/api/users", { query: { search, page, pageSize: 20 } }),
    placeholderData: (prev) => prev,
  });
}

export function useAdminReservations(filter: AdminReservationFilter) {
  return useQuery({
    queryKey: keys.adminReservations(filter),
    queryFn: () =>
      api<PagedResult<AdminReservationDto>>("/api/admin/reservations", {
        query: { status: filter.status, showtimeId: filter.showtimeId, page: filter.page, pageSize: 20 },
      }),
    placeholderData: (prev) => prev,
  });
}
