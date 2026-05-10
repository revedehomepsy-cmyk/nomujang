"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    router.push(search.get("callbackUrl") || "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <label className="label">이메일</label>
        <input
          className="input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="label">비밀번호</label>
        <input
          className="input"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "로그인 중..." : "로그인"}
      </button>
      <div className="text-center text-sm">
        <Link href="/register" className="text-brand hover:underline">
          회원가입
        </Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-brand">노무장</div>
          <div className="text-sm text-slate-500 mt-1">현장 노무 관리</div>
        </div>
        <Suspense fallback={<div className="card">로딩 중...</div>}>
          <LoginForm />
        </Suspense>
        <div className="text-xs text-slate-400 text-center mt-4">
          시드 계정: admin@nomujang.kr / site@nomujang.kr / foreman@nomujang.kr (비밀번호 test1234)
        </div>
      </div>
    </main>
  );
}
