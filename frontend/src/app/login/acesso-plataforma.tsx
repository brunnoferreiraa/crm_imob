"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { loginSchema, type LoginInput } from "@/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>(),
    [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  async function onSubmit(values: LoginInput) {
    setServerError(undefined);
    try {
      await axios.post("/api/auth/login", values);
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setServerError(
        axios.isAxiosError(error)
          ? (error.response?.data?.detail ??
              error.response?.data?.message ??
              "Não foi possível entrar")
          : "Não foi possível entrar",
      );
    }
  }
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 lg:grid lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#07111f] p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div className="absolute -left-32 -top-32 size-[30rem] rounded-full bg-emerald-500/15 blur-[100px]" />
        <div className="absolute -bottom-40 right-0 size-[34rem] rounded-full bg-teal-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <Link href="/" className="relative flex w-fit items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-teal-600 shadow-xl shadow-emerald-950 ring-1 ring-white/20">
            <Building2 className="size-5" />
          </span>
          <span>
            <strong className="block text-xl leading-none">ImobCRM</strong>
            <small className="text-[11px] text-slate-500">Gestão imobiliária</small>
          </span>
        </Link>
        <div className="relative my-auto max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <ShieldCheck className="size-3.5" />
            Plataforma segura e inteligente
          </span>
          <h1 className="mt-7 text-5xl font-bold leading-[1.08] tracking-tight xl:text-6xl">
            Sua imobiliária,
            <br />
            <span className="bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">
              em outro nível.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            Centralize clientes, imóveis e negociações em uma experiência criada para equipes que
            querem vender mais.
          </p>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {[
              [Home, "Imóveis"],
              [Users, "Clientes"],
              [BarChart3, "Resultados"],
            ].map(([Icon, label]) => {
              const ItemIcon = Icon as typeof Home;
              return (
                <div
                  key={String(label)}
                  className="rounded-2xl border border-white/[.07] bg-white/[.04] p-4 backdrop-blur"
                >
                  <ItemIcon className="size-5 text-emerald-400" />
                  <p className="mt-3 text-sm font-medium">{String(label)}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-slate-500">
          <CheckCircle2 className="size-4 text-emerald-500" />
          Acesso protegido para sua equipe
        </div>
      </section>
      <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="absolute right-5 top-5 sm:right-8 sm:top-7">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-[430px]">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg">
              <Building2 />
            </span>
            <strong className="text-xl">ImobCRM</strong>
          </div>
          <div className="mb-8">
            <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <LockKeyhole className="size-5" />
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Bem-vindo de volta
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Entre com suas credenciais para acessar sua área de trabalho.
            </p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="mb-2 block text-sm font-semibold" htmlFor="email">
                E-mail
              </label>
              <input
                className="h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 shadow-sm outline-none transition placeholder:text-slate-300 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                id="email"
                type="email"
                placeholder="voce@imobiliaria.com.br"
                autoComplete="email"
                autoFocus
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold" htmlFor="password">
                  Senha
                </label>
                <Link
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-600"
                  href="/recuperar-senha"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <input
                  className="h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 shadow-sm outline-none transition placeholder:text-slate-300 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  {...register("password")}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            {serverError && (
              <p
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
              >
                {serverError}
              </p>
            )}
            <button
              className="group flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b1220] font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-emerald-700/20 disabled:pointer-events-none disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar no CRM
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
          <p className="mt-8 text-center text-xs text-slate-400">
            Ao entrar, você concorda com as políticas de segurança da plataforma.
          </p>
        </div>
      </section>
    </main>
  );
}
