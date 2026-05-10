"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ROLE_LABEL, type Role } from "@/lib/auth";

interface NavItem {
  href: string;
  label: string;
}

export default function TopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { data } = useSession();
  const role = (data?.user as any)?.role as Role | undefined;
  const name = data?.user?.name;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-brand">
            노무장
          </Link>
          {role && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand">
              {ROLE_LABEL[role]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 hidden sm:inline">{name}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            로그아웃
          </button>
        </div>
      </div>
      <nav className="max-w-5xl mx-auto px-2 flex gap-1 overflow-x-auto">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap px-3 py-2 text-sm border-b-2 ${
                active
                  ? "border-brand text-brand font-semibold"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
