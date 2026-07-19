"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  BarChart3,
  Building2,
  CalendarDays,
  CheckSquare,
  Handshake,
  House,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { NotificationBell } from "@/components/notification-bell";
import { LanguageSwitcher } from "@/components/language-switcher";

const operation = [
  ["/dashboard", "Visão geral", LayoutDashboard],
  ["/clientes", "Clientes", Users],
  ["/imoveis", "Imóveis", House],
] as const;
const commercial = [
  ["/negociacoes", "Negociações", Handshake],
  ["/visitas", "Visitas", CalendarDays],
  ["/tarefas", "Tarefas", CheckSquare],
] as const;
const management = [
  ["/relatorios", "Relatórios", BarChart3],
  ["/proprietarios", "Proprietários", UserRound],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname(),
    router = useRouter(),
    { resolvedTheme, setTheme } = useTheme();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () =>
      (
        await axios.get<{
          full_name: string;
          email: string;
          role: { name: string; slug: string };
        }>("/api/auth/me")
      ).data,
    staleTime: 300000,
  });
  const groups = [
    ["Operação", operation],
    ["Comercial", commercial],
    [
      "Administração",
      [
        ...management,
        ...(me.data?.role.slug === "admin"
          ? ([["/usuarios", "Usuários", ShieldCheck]] as const)
          : []),
        ["/configuracoes", "Configurações", Settings] as const,
      ],
    ],
  ] as const;
  async function logout() {
    await axios.post("/api/auth/logout");
    router.replace("/login");
    router.refresh();
  }
  const navigation = (
    <nav className="space-y-6">
      {groups.map(([group, items]) => (
        <section key={group}>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-600">
            {group}
          </p>
          <div className="space-y-1">
            {items.map(([href, label, Icon]) => {
              const active = path.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${active ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-950/25" : "text-slate-400 hover:translate-x-0.5 hover:bg-white/[.06] hover:text-white"}`}
                >
                  <Icon
                    className={`size-[18px] ${active ? "" : "text-slate-500 transition-colors group-hover:text-emerald-400"}`}
                  />
                  <span>{label}</span>
                  {active && (
                    <span className="ml-auto flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-slate-950/60" />
                      <span className="h-4 w-0.5 rounded-full bg-slate-950/20" />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#080d18] dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col overflow-hidden border-r border-white/8 bg-[#09111f] p-4 text-white shadow-2xl xl:flex">
        <div className="pointer-events-none absolute -left-20 -top-24 size-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <Link
          href="/dashboard"
          className="relative mb-8 flex items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-2.5"
        >
          <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-600 shadow-lg shadow-emerald-950 ring-1 ring-white/20">
            <Building2 className="size-5" />
          </span>
          <span>
            <strong className="block text-lg leading-none">ImobCRM</strong>
            <small className="text-[11px] text-slate-500">
              Gestão imobiliária
            </small>
          </span>
        </Link>
        <div className="relative flex-1 overflow-y-auto pr-1">{navigation}</div>
        <div className="relative mt-4 rounded-2xl border border-white/8 bg-gradient-to-br from-white/[.07] to-white/[.025] p-3 shadow-inner">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-sm font-bold text-emerald-300 ring-1 ring-emerald-400/20">
              {me.data?.full_name?.charAt(0) || "U"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">
                {me.data?.full_name}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {me.data?.role.name} · Online
              </p>
            </div>
            <button
              aria-label="Sair"
              onClick={logout}
              className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur-xl dark:border-white/8 dark:bg-[#080d18]/85 xl:ml-64">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              aria-label="Abrir menu"
              className="rounded-xl border bg-white p-2 dark:bg-slate-900 xl:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-bold xl:hidden"
            >
              <Building2 className="text-emerald-600" />
              ImobCRM
            </Link>
            <div className="hidden items-center gap-2 text-sm text-slate-500 xl:flex">
              <Sparkles className="size-4 text-emerald-500" />
              <span>
                Olá, {me.data?.full_name?.split(" ")[0] || "bem-vindo"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            <NotificationBell />
            <button
              aria-label="Alternar tema"
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {resolvedTheme === "dark" ? (
                <Sun className="size-[18px]" />
              ) : (
                <Moon className="size-[18px]" />
              )}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[min(85vw,300px)] flex-col bg-[#0b1220] p-4 text-white shadow-2xl">
            <div className="mb-7 flex items-center justify-between">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 font-bold"
              >
                <Building2 className="text-emerald-400" />
                ImobCRM
              </Link>
              <button
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-white/10"
              >
                <X />
              </button>
            </div>
            {navigation}
          </aside>
        </div>
      )}
      <main className="xl:ml-64">
        <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8 xl:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
