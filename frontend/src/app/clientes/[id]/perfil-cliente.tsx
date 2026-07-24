"use client";

import { AdminShell } from "@/components/admin-shell";
import type { Client } from "@/types/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CalendarClock, Mail, MapPin, MessageSquarePlus, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Interaction = {
  id: string;
  contact_type: string;
  occurred_at: string;
  description: string;
  result: string | null;
  next_action: string | null;
  broker: { name: string };
};
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>(),
    qc = useQueryClient();
  const query = useQuery({
    queryKey: ["client", id],
    queryFn: async () => (await axios.get<Client>(`/api/clients/${id}`)).data,
  });
  const history = useQuery({
    queryKey: ["interactions", id],
    queryFn: async () => (await axios.get<Interaction[]>(`/api/clients/${id}/interactions`)).data,
  });
  const create = useMutation({
    mutationFn: (form: FormData) =>
      axios.post("/api/interactions", {
        client_id: id,
        contact_type: form.get("contact_type"),
        occurred_at: new Date(String(form.get("occurred_at"))).toISOString(),
        description: form.get("description"),
        result: form.get("result") || null,
        next_action: form.get("next_action") || null,
        next_contact_at: form.get("next_contact_at")
          ? new Date(String(form.get("next_contact_at"))).toISOString()
          : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interactions", id] });
      qc.invalidateQueries({ queryKey: ["client", id] });
    },
  });
  if (query.isLoading)
    return (
      <AdminShell>
        <p>Carregando cliente...</p>
      </AdminShell>
    );
  if (!query.data)
    return (
      <AdminShell>
        <p className="text-red-600">Cliente não encontrado.</p>
      </AdminShell>
    );
  const c = query.data;
  return (
    <AdminShell>
      <Link className="text-sm font-medium text-emerald-700" href="/clientes">
        ← Voltar para clientes
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-emerald-700">{c.client_type}</p>
                <h1 className="text-3xl font-bold">{c.name}</h1>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                {c.status.replace("_", " ")}
              </span>
            </div>
            <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <p className="flex gap-2">
                <Phone className="size-4" />
                {c.phone}
              </p>
              <p className="flex gap-2">
                <Mail className="size-4" />
                {c.email ?? "Não informado"}
              </p>
              <p className="flex gap-2">
                <UserRound className="size-4" />
                {c.responsible.full_name}
              </p>
              <p className="flex gap-2">
                <CalendarClock className="size-4" />
                {c.next_contact_at
                  ? new Date(c.next_contact_at).toLocaleString("pt-BR")
                  : "Sem próximo contato"}
              </p>
            </div>
          </div>
          <section className="rounded-2xl border bg-white p-6 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">Histórico de interações</h2>
            <form
              className="mt-4 grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate(new FormData(e.currentTarget));
                e.currentTarget.reset();
              }}
            >
              <select
                required
                name="contact_type"
                className="h-11 rounded-xl border bg-transparent px-3"
              >
                <option value="">Tipo de contato</option>
                <option>telefone</option>
                <option>whatsapp</option>
                <option>email</option>
                <option>presencial</option>
              </select>
              <input
                required
                name="occurred_at"
                type="datetime-local"
                className="h-11 rounded-xl border bg-transparent px-3"
              />
              <textarea
                required
                name="description"
                placeholder="Descrição do contato"
                className="rounded-xl border bg-transparent p-3 sm:col-span-2"
              />
              <input
                name="result"
                placeholder="Resultado"
                className="h-11 rounded-xl border bg-transparent px-3"
              />
              <input
                name="next_action"
                placeholder="Próxima ação"
                className="h-11 rounded-xl border bg-transparent px-3"
              />
              <label className="text-sm">
                Próximo contato
                <input
                  name="next_contact_at"
                  type="datetime-local"
                  className="mt-1 h-11 w-full rounded-xl border bg-transparent px-3"
                />
              </label>
              <button
                disabled={create.isPending}
                className="flex h-11 items-center justify-center gap-2 self-end rounded-xl bg-emerald-600 font-semibold text-white"
              >
                <MessageSquarePlus className="size-4" />
                Registrar
              </button>
            </form>
            <div className="mt-6 space-y-4">
              {history.data?.map((i) => (
                <article key={i.id} className="border-l-2 border-emerald-500 pl-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <strong className="capitalize">{i.contact_type}</strong>
                    <time className="text-xs text-slate-500">
                      {new Date(i.occurred_at).toLocaleString("pt-BR")}
                    </time>
                  </div>
                  <p className="mt-1 text-sm">{i.description}</p>
                  {(i.result || i.next_action) && (
                    <p className="mt-1 text-xs text-slate-500">
                      {i.result && `Resultado: ${i.result}. `}
                      {i.next_action && `Próxima ação: ${i.next_action}`}
                    </p>
                  )}
                </article>
              ))}
              {history.data?.length === 0 && (
                <p className="text-sm text-slate-500">Nenhuma interação registrada.</p>
              )}
            </div>
          </section>
        </section>
        <aside className="space-y-6">
          <section className="rounded-2xl border bg-white p-6 dark:bg-slate-900">
            <h2 className="font-semibold">Interesse</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Tipo</dt>
                <dd>{c.interest.property_type ?? "Não informado"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Orçamento</dt>
                <dd>
                  {c.interest.budget_min ? money.format(Number(c.interest.budget_min)) : "—"} até{" "}
                  {c.interest.budget_max ? money.format(Number(c.interest.budget_max)) : "—"}
                </dd>
              </div>
              <div>
                <dt className="flex gap-1 text-slate-500">
                  <MapPin className="size-4" />
                  Localização
                </dt>
                <dd>
                  {[...c.interest.cities, ...c.interest.neighborhoods].join(", ") ||
                    "Não informada"}
                </dd>
              </div>
            </dl>
          </section>
          <section className="rounded-2xl border bg-white p-6 dark:bg-slate-900">
            <h2 className="font-semibold">Observações</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
              {c.notes || "Nenhuma observação."}
            </p>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}
