"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { Sparkles } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { authStore } from "@/lib/auth-store";
import type { AuthResponse } from "@/lib/types";
import { AuthShell, safeNext } from "@/components/auth-shell";
import { Button, Field } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api<AuthResponse>("/api/auth/login", { method: "POST", body, auth: false }),
    onSuccess: (res) => {
      authStore.set(res);
      toast.success(`Xin chào, ${res.user.fullName}!`);
      router.replace(next === "/" && res.user.role === "Admin" ? "/admin" : next);
    },
  });

  const error = login.error instanceof ApiError ? login.error : null;

  return (
    <AuthShell title="Đăng nhập" subtitle="Đăng nhập để đặt vé và xem lại vé đã mua.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate({ email, password });
        }}
      >
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="ban@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error?.fieldError("Email")}
          required
        />
        <Field
          label="Mật khẩu"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error?.fieldError("Password")}
          required
        />
        {login.error && !error?.problem.errors && (
          <p className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-3.5 py-2.5 text-sm text-brand-300">{login.error.message}</p>
        )}
        <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
          Đăng nhập
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setEmail("demo@movie.local");
          setPassword("Demo@12345");
          login.mutate({ email: "demo@movie.local", password: "Demo@12345" });
        }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink-600 py-3 text-sm text-ink-300 transition hover:border-gold-400/60 hover:text-gold-300"
      >
        <Sparkles className="size-4" /> Dùng tài khoản khách demo
      </button>

      <p className="mt-8 text-center text-sm text-ink-400">
        Chưa có tài khoản?{" "}
        <Link href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-300 hover:text-brand-400">
          Đăng ký ngay
        </Link>
      </p>
    </AuthShell>
  );
}
