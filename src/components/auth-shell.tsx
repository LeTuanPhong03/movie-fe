import type { ReactNode } from "react";
import { Armchair, Popcorn, Ticket } from "lucide-react";

/** Khung chung cho trang đăng nhập / đăng ký: bên trái là banner (ẩn trên mobile), bên phải là form. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="relative hidden h-full max-h-[620px] overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-brand-600 via-brand-700 to-ink-950 p-10 lg:flex lg:flex-col lg:justify-end">
        <div className="absolute -left-20 -top-20 size-80 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="absolute -bottom-24 right-0 size-96 rounded-full bg-brand-400/30 blur-3xl" />
        <div className="relative">
          <h2 className="text-4xl font-black leading-tight text-white">
            Mỗi suất chiếu
            <br />
            là một trải nghiệm.
          </h2>
          <p className="mt-4 max-w-sm text-white/75">Chọn ghế đẹp nhất, giữ ghế 10 phút và thanh toán chỉ vài chạm.</p>
          <div className="mt-8 flex gap-3">
            {[Ticket, Armchair, Popcorn].map((Icon, i) => (
              <span key={i} className="grid size-12 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur">
                <Icon className="size-6" />
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md animate-fade-up">
        <h1 className="text-3xl font-black tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-sm text-ink-400">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
