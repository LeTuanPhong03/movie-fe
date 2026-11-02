import Link from "next/link";
import { Logo } from "./header";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-ink-800 bg-ink-900/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="sm:col-span-2 lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">
            Đặt vé xem phim nhanh: chọn suất, chọn ghế, giữ ghế 10 phút và thanh toán qua VNPay. Không bao giờ bán một ghế cho hai người.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Khám phá</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-400">
            <li><Link className="hover:text-white" href="/movies">Phim đang chiếu</Link></li>
            <li><Link className="hover:text-white" href="/showtimes">Lịch chiếu</Link></li>
            <li><Link className="hover:text-white" href="/tickets">Vé của tôi</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Hỗ trợ</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-400">
            <li>Hotline: 1900 0000</li>
            <li>Giờ mở cửa: 8:00 – 24:00</li>
            <li>Thanh toán: VNPay</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-800 py-5 text-center text-xs text-ink-500">
        Dự án học tập · Movie Reservation System
      </div>
    </footer>
  );
}
