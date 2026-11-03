// Kiểu dữ liệu khớp 1-1 với DTO của backend (ASP.NET trả JSON camelCase, enum dạng chữ nhờ JsonStringEnumConverter).
// DateTime của BE là UTC dạng ISO ("2026-11-02T02:30:00Z") → luôn đổi sang giờ VN khi hiển thị (lib/format.ts).

export type Role = "Admin" | "Customer";

export interface UserDto {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  /** Admin tạo từ cấu hình BE: không ai đổi được quyền, chỉ Owner hạ được Admin khác. */
  isOwner: boolean;
}

/** Body của register / login / refresh. Không có refresh token: BE đặt nó vào cookie HttpOnly, JS không đọc được. */
export interface AuthResponse {
  user: UserDto;
  accessToken: string;
  accessTokenExpiresAt: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface MovieDto {
  id: number;
  title: string;
  description: string | null;
  durationMinutes: number;
  genre: string;
  suitableAge: number;
  posterUrl: string | null;
  isActive: boolean;
}

export interface MovieInput {
  title: string;
  description: string | null;
  durationMinutes: number;
  genre: string;
  suitableAge: number;
  posterUrl: string | null;
}

export interface ShowtimeDto {
  id: number;
  movieId: number;
  title: string;
  startAt: string;
  movieEndAt: string;
  theaterName: string;
  price: number;
}

export type SeatStatus = "Available" | "Held" | "Booked";

export interface SeatStatusDto {
  id: number;
  row: string;
  number: number;
  status: SeatStatus;
}

export interface SeatMapDto {
  showtimeId: number;
  seats: SeatStatusDto[];
}

export type ReservationStatus = "Pending" | "Confirmed" | "Cancelled" | "Expired";

export interface ReservationDto {
  id: number;
  status: ReservationStatus;
  totalPrice: number;
  expiresAt: string;
  showtimeId: number;
  movieId: number;
  movieTitle: string;
  theaterName: string;
  startAt: string;
  movieEndAt: string;
  seats: { row: string; number: number }[];
}

export interface PaymentLinkDto {
  paymentUrl: string;
  expiresAt: string;
}

export type PaymentStatus = "Pending" | "Succeeded" | "Failed" | "RefundRequired" | "Refunded";

export interface VnPayCallbackResult {
  rspCode: string;
  message: string;
  reservationId: number | null;
  paymentStatus: PaymentStatus | null;
}

export interface TheaterDto {
  id: number;
  name: string;
  rows: number;
  seatsPerRow: number;
  totalSeats: number;
}

export type RevenueGroupBy = "Day" | "Movie";

export interface RevenueReportDto {
  from: string;
  to: string;
  groupBy: RevenueGroupBy;
  totalRevenue: number;
  totalReservations: number;
  totalTickets: number;
  /** movieId chỉ có khi nhóm theo phim: tên phim không unique → dùng movieId làm React key. */
  rows: { key: string; revenue: number; reservations: number; tickets: number; movieId: number | null }[];
}

export interface AdminReservationDto {
  userId: number;
  userEmail: string;
  userFullName: string;
  reservation: ReservationDto;
}

export interface CapacityRowDto {
  showtimeId: number;
  movieId: number;
  movieTitle: string;
  theaterName: string;
  startAt: string;
  totalSeats: number;
  bookedSeats: number;
  heldSeats: number;
  availableSeats: number;
  occupancyPercent: number;
}

export interface CapacityReportDto {
  from: string;
  to: string;
  totalSeats: number;
  bookedSeats: number;
  occupancyPercent: number;
  rows: CapacityRowDto[];
}

/** Body lỗi chuẩn ProblemDetails mà GlobalExceptionHandler của BE trả về. */
export interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

/** Giới hạn lấy từ Domain của BE (Reservation.MaxSeats, Reservation.HoldMinutes). */
export const MAX_SEATS = 8;
export const HOLD_MINUTES = 10;
/** Reservation.PaidCancelCutoffMinutes: khách chỉ tự huỷ vé ĐÃ thanh toán khi còn hơn chừng này phút tới giờ chiếu. */
export const PAID_CANCEL_CUTOFF_MINUTES = 120;

export interface RefundDto {
  paymentId: number;
  reservationId: number;
  reservationStatus: ReservationStatus;
  userEmail: string;
  userFullName: string;
  movieTitle: string;
  startAt: string;
  amount: number;
  txnRef: string;
  providerTransactionNo: string | null;
  status: PaymentStatus;
  paidAt: string | null;
  refundedAt: string | null;
}
