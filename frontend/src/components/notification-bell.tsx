"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Bell, CalendarDays, CheckSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
type Task = { id: string; title: string; due_at: string; status: string };
type Visit = {
  id: string;
  scheduled_at: string;
  status: string;
  client: { name: string };
};
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const tasks = useQuery({
    queryKey: ["tasks", "alerts"],
    queryFn: async () => (await axios.get<Task[]>("/api/tasks")).data,
    refetchInterval: 60000,
  });
  const visits = useQuery({
    queryKey: ["visits", "alerts"],
    queryFn: async () => (await axios.get<Visit[]>("/api/visits")).data,
    refetchInterval: 60000,
  });
  const day = 86400000;
  const alerts = [
    ...(tasks.data ?? [])
      .filter((x) => x.status !== "concluida" && new Date(x.due_at).getTime() < now)
      .map((x) => ({
        id: x.id,
        href: "/tarefas",
        title: "Tarefa vencida",
        text: x.title,
        Icon: CheckSquare,
      })),
    ...(visits.data ?? [])
      .filter((x) => {
        const time = new Date(x.scheduled_at).getTime();
        return x.status === "agendada" && time >= now && time <= now + day;
      })
      .map((x) => ({
        id: x.id,
        href: "/visitas",
        title: "Visita nas próximas 24h",
        text: x.client.name,
        Icon: CalendarDays,
      })),
  ];
  return (
    <div className="relative">
      <button
        aria-label={`${alerts.length} notificações`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 hover:bg-white/10"
      >
        <Bell className="size-5" />
        {alerts.length > 0 && (
          <span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-red-500 text-[10px] font-bold">
            {Math.min(alerts.length, 9)}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <h2 className="border-b p-4 font-semibold">Notificações</h2>
          <div className="max-h-80 overflow-auto">
            {alerts.map((a) => (
              <Link
                key={`${a.title}-${a.id}`}
                onClick={() => setOpen(false)}
                href={a.href}
                className="flex gap-3 border-b p-4 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <a.Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <span>
                  <strong className="block text-sm">{a.title}</strong>
                  <small className="text-slate-500">{a.text}</small>
                </span>
              </Link>
            ))}
            {alerts.length === 0 && (
              <p className="p-6 text-center text-sm text-slate-500">Tudo em dia por aqui.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
