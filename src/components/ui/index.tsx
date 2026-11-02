"use client";

import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, useEffect } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Loader2, X } from "lucide-react";
import type { ReservationStatus } from "@/lib/types";

// ─── Button ───────────────────────────────────────────────────────
type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-400 hover:shadow-brand-500/40 active:bg-brand-600",
  secondary: "bg-ink-700 text-ink-100 hover:bg-ink-600",
  ghost: "text-ink-300 hover:bg-ink-800 hover:text-white",
  outline: "border border-ink-600 text-ink-100 hover:border-ink-400 hover:bg-ink-800",
  danger: "border border-brand-500/40 text-brand-300 hover:bg-brand-500/10 hover:border-brand-400",
};
const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return clsx(
    "inline-flex shrink-0 items-center justify-center font-semibold transition-all duration-200 select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
    "disabled:pointer-events-none disabled:opacity-50",
    variantClass[variant],
    sizeClass[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ variant, size, loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant,
  size,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

// ─── Form ─────────────────────────────────────────────────────────
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, error, hint, className, id, ...rest }, ref) {
  const inputId = id ?? rest.name;
  return (
    <label htmlFor={inputId} className={clsx("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-ink-300">{label}</span>
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          "h-11 w-full rounded-xl border bg-ink-900 px-3.5 text-sm text-white placeholder:text-ink-500 transition",
          "focus:outline-none focus:ring-2",
          error
            ? "border-brand-500/70 focus:ring-brand-500/30"
            : "border-ink-600 focus:border-brand-400 focus:ring-brand-500/20",
        )}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <span className="mt-1.5 block text-xs text-brand-300">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-ink-400">{hint}</span>
      ) : null}
    </label>
  );
});

export const inputClass =
  "h-11 w-full rounded-xl border border-ink-600 bg-ink-900 px-3.5 text-sm text-white placeholder:text-ink-500 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

// ─── Trạng thái tải / rỗng / lỗi ───────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton rounded-xl", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx("animate-spin text-brand-400", className ?? "size-6")} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex animate-fade-in flex-col items-center rounded-2xl border border-dashed border-ink-600 bg-ink-900/50 px-6 py-14 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-ink-800 text-ink-400">{icon}</div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-brand-500/30 bg-brand-500/5 px-6 py-10 text-center">
      <p className="text-sm text-brand-300">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}

// ─── Nhãn trạng thái đơn ────────────────────────────────────────────
const statusStyle: Record<ReservationStatus, { label: string; className: string }> = {
  Pending: { label: "Chờ thanh toán", className: "bg-gold-400/15 text-gold-300 ring-gold-400/30" },
  Confirmed: { label: "Đã thanh toán", className: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" },
  Cancelled: { label: "Đã huỷ", className: "bg-ink-600/50 text-ink-300 ring-ink-500/40" },
  Expired: { label: "Hết hạn", className: "bg-brand-500/10 text-brand-300 ring-brand-500/25" },
};

export const statusLabel = (s: ReservationStatus) => statusStyle[s].label;

export function StatusBadge({ status }: { status: ReservationStatus }) {
  const s = statusStyle[status];
  return (
    <span className={clsx("inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1", s.className)}>
      {s.label}
    </span>
  );
}

// ─── Hộp thoại ─────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={clsx(
          "relative max-h-[92dvh] w-full animate-fade-up overflow-y-auto rounded-t-3xl border border-ink-700 bg-ink-850 p-5 shadow-2xl sm:rounded-3xl sm:p-6",
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-700 hover:text-white" aria-label="Đóng">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="text-sm leading-relaxed text-ink-300">{description}</div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose}>
          Quay lại
        </Button>
        <Button onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
        <span className="h-6 w-1.5 rounded-full bg-gradient-to-b from-brand-400 to-brand-600" />
        {children}
      </h2>
      {action}
    </div>
  );
}
