"use client";

import { AdminShell } from "@/components/admin-shell";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckSquare,
  Handshake,
  Info,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
type Data = {
  metrics: Record<string, number>;
  leads_by_day: { date: string; total: number }[];
  deals_by_stage: { stage: string; total: number }[];
  recent_activities: { at: string; type: string; client: string }[];
};
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const demoLeads = [
  { date: "Seg", total: 3 },
  { date: "Ter", total: 5 },
  { date: "Qua", total: 4 },
  { date: "Qui", total: 8 },
  { date: "Sex", total: 6 },
  { date: "Sáb", total: 9 },
  { date: "Dom", total: 7 },
];
const demoStages = [
  { stage: "Lead", total: 12 },
  { stage: "Contato", total: 9 },
  { stage: "Qualificado", total: 7 },
  { stage: "Visita", total: 5 },
  { stage: "Proposta", total: 3 },
  { stage: "Ganho", total: 2 },
];
const stageLabels: Record<string, string> = {
  lead_novo: "Lead",
  contato_realizado: "Contato",
  qualificado: "Qualificado",
  visita_agendada: "Visita",
  proposta_enviada: "Proposta",
  negociacao: "Negociação",
  contrato: "Contrato",
  ganho: "Ganho",
  perdido: "Perdido",
};
export default function Dashboard() {
  const q = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await axios.get<Data>("/api/dashboard")).data,
  });
  if (!q.data)
    return (
      <AdminShell>
        <div className="grid min-h-80 place-items-center">
          <div className="size-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      </AdminShell>
    );
  const m = q.data.metrics;
  const cards = [
    [
      "Leads novos",
      m.new_leads,
      Users,
      "bg-blue-50 text-blue-600 dark:bg-blue-500/10",
      "/clientes",
    ],
    [
      "Em atendimento",
      m.in_service,
      TrendingUp,
      "bg-violet-50 text-violet-600 dark:bg-violet-500/10",
      "/clientes",
    ],
    [
      "Visitas agendadas",
      m.scheduled_visits,
      CalendarDays,
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
      "/visitas",
    ],
    [
      "Negociações abertas",
      m.open_deals,
      Handshake,
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
      "/negociacoes",
    ],
    [
      "Negócios ganhos",
      m.won_deals,
      BarChart3,
      "bg-teal-50 text-teal-600 dark:bg-teal-500/10",
      "/negociacoes",
    ],
    [
      "Imóveis disponíveis",
      m.available_properties,
      Building2,
      "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10",
      "/imoveis",
    ],
    [
      "Tarefas atrasadas",
      m.overdue_tasks,
      CheckSquare,
      "bg-red-50 text-red-600 dark:bg-red-500/10",
      "/tarefas",
    ],
  ] as const;
  const demoLead = q.data.leads_by_day.length < 2,
    demoDeal = q.data.deals_by_stage.length === 0;
  const leads = demoLead
    ? demoLeads
    : q.data.leads_by_day.map((x) => ({
        ...x,
        date: new Date(`${x.date}T12:00:00`).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        }),
      }));
  const stages = demoDeal
    ? demoStages
    : q.data.deals_by_stage.map((x) => ({
        ...x,
        stage: stageLabels[x.stage] ?? x.stage,
      }));
  return (
    <AdminShell>
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="page-kicker">Painel comercial</p>
          <h1 className="text-3xl font-bold tracking-tight">Visão geral</h1>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe os principais números da sua operação.
          </p>
        </div>
        <p className="w-fit rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm dark:bg-slate-900">
          Atualizado agora
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, Icon, color, href]) => (
          <Link
            href={href}
            key={label}
            className="surface group flex min-h-28 items-center gap-4 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:hover:border-emerald-500/30"
          >
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${color}`}>
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <strong className="block text-2xl font-bold leading-none tracking-tight">
                {value}
              </strong>
              <p className="mt-2 truncate text-sm text-slate-500">{label}</p>
            </div>
            <ArrowUpRight className="ml-auto size-4 self-start text-slate-300 transition group-hover:text-emerald-500" />
          </Link>
        ))}
        <article className="relative flex min-h-28 items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1220] to-[#12443a] p-4 text-white shadow-lg shadow-emerald-950/10 sm:col-span-2 lg:col-span-1">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-emerald-300">
            <WalletCards className="size-5" />
          </span>
          <div>
            <p className="text-xs text-slate-400">Volume financeiro</p>
            <strong className="mt-1 block text-xl tracking-tight">
              {money.format(m.deal_value)}
            </strong>
            <span className="mt-1.5 inline-flex rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
              Conversão {m.conversion_rate}%
            </span>
          </div>
        </article>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Evolução de leads"
          subtitle="Novos contatos nos últimos dias"
          demo={demoLead}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={leads} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="leadLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#10b981" stopOpacity=".25" />
                  <stop offset="1" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e155" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={11} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} fontSize={11} />
              <Tooltip
                cursor={{ stroke: "#10b981", strokeOpacity: 0.2 }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 8px 24px #0f172a12",
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="Leads"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", strokeWidth: 3, stroke: "#fff", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Funil de negociações"
          subtitle="Distribuição por etapa comercial"
          demo={demoDeal}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stages} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e155" />
              <XAxis dataKey="stage" axisLine={false} tickLine={false} fontSize={10} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} fontSize={11} />
              <Tooltip
                cursor={{ fill: "#10b9810a" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 8px 24px #0f172a12",
                }}
              />
              <Bar
                dataKey="total"
                name="Negociações"
                fill="#0f766e"
                radius={[7, 7, 2, 2]}
                maxBarSize={44}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <section className="surface mt-5 overflow-hidden">
        <div className="border-b border-slate-100 p-4 dark:border-white/8">
          <h2 className="font-semibold">Atividades recentes</h2>
          <p className="text-xs text-slate-500">Últimas movimentações da equipe</p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/8">
          {q.data.recent_activities.map((a, i) => (
            <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm" key={i}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="size-2 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10" />
                <span className="truncate">
                  <b>{a.client}</b>
                  <span className="text-slate-500"> · {a.type}</span>
                </span>
              </div>
              <time className="shrink-0 text-xs text-slate-400">
                {new Date(a.at).toLocaleString("pt-BR")}
              </time>
            </div>
          ))}
          {!q.data.recent_activities.length && (
            <p className="p-6 text-center text-sm text-slate-500">Nenhuma atividade recente.</p>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
function ChartCard({
  title,
  subtitle,
  demo,
  children,
}: {
  title: string;
  subtitle: string;
  demo: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="surface h-72 p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        {demo && (
          <span
            title="Aparece quando ainda não há dados suficientes"
            className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700"
          >
            <Info className="size-3" />
            Demonstração
          </span>
        )}
      </div>
      <div className="h-[calc(100%-3rem)]">{children}</div>
    </section>
  );
}
