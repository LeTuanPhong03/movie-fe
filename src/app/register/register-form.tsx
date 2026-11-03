"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { api, ApiError } from "@/lib/api";
import { authStore } from "@/lib/auth-store";
import type { AuthResponse } from "@/lib/types";
import { AuthShell, safeNext } from "@/components/auth-shell";
import { Button, Field } from "@/components/ui";

// Luật giống RegisterCommandValidator của BE: kiểm trước ở FE để báo lỗi ngay, BE vẫn kiểm lại (FE có thể bị bỏ qua).
function validate(f: { fullName: string; email: string; password: string; confirmPassword: string }) {
  const e: Record<string, string> = {};
  if (!f.fullName.trim()) e.fullName = "Vui lòng nhập họ tên.";
  if (f.password.length < 8) e.password = "Mật khẩu tối thiểu 8 ký tự.";
  else if (f.password.length > 72) e.password = "Mật khẩu tối đa 72 ký tự.";
  if (f.confirmPassword !== f.password) e.confirmPassword = "Mật khẩu nhập lại không khớp.";
  return e;
}

export function RegisterForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const register = useMutation({
    mutationFn: () => api<AuthResponse>("/api/auth/register", { method: "POST", body: form, auth: false }),
    onSuccess: (res) => {
      authStore.set(res);
      toast.success("Tạo tài khoản thành công!");
      router.replace(next);
    },
  });

  const apiError = register.error instanceof ApiError ? register.error : null;
  const err = (field: string) => errors[field] ?? apiError?.fieldError(field);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: "" });
  };

  return (
    <AuthShell title="Tạo tài khoản" subtitle="Chỉ mất 30 giây để bắt đầu đặt vé.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const v = validate(form);
          setErrors(v);
          if (Object.keys(v).length === 0) register.mutate();
        }}
        noValidate
      >
        <Field label="Họ và tên" name="fullName" autoComplete="name" placeholder="Nguyễn Văn A" value={form.fullName} onChange={set("fullName")} error={err("fullName")} />
        <Field label="Email" name="email" type="email" autoComplete="email" placeholder="ban@email.com" value={form.email} onChange={set("email")} error={err("email")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mật khẩu" name="password" type="password" autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" value={form.password} onChange={set("password")} error={err("password")} />
          <Field
            label="Nhập lại mật khẩu"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            error={err("confirmPassword")}
          />
        </div>
        {register.error && !apiError?.problem.errors && (
          <p className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-3.5 py-2.5 text-sm text-brand-300">{register.error.message}</p>
        )}
        <Button type="submit" size="lg" className="w-full" loading={register.isPending}>
          Đăng ký
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-ink-400">
        Đã có tài khoản?{" "}
        <Link href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-300 hover:text-brand-400">
          Đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
}
