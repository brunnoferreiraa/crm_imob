"use client";
import { AdminShell } from "@/components/admin-shell";
import type { ClientPage } from "@/types/client";
import type { Deal } from "@/types/deal";
import type { PropertyPage } from "@/types/property";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { GripVertical, Plus } from "lucide-react";
import { useState } from "react";
const stages = [
  ["lead_novo", "Lead novo"],
  ["contato_realizado", "Contato realizado"],
  ["qualificado", "Qualificado"],
  ["visita_agendada", "Visita agendada"],
  ["proposta_enviada", "Proposta enviada"],
  ["negociacao", "Negociação"],
  ["contrato", "Contrato"],
  ["ganho", "Ganho"],
  ["perdido", "Perdido"],
] as const;
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
function Card({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  });
  return (
    <article
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="rounded-xl border bg-white p-3 shadow-sm dark:bg-slate-900"
    >
      <div className="flex justify-between">
        <span className="text-xs font-semibold text-emerald-700">{deal.probability}%</span>
        <button
          type="button"
          aria-label={`Mover negociação ${deal.title}`}
          className="cursor-grab rounded-lg p-1 hover:bg-slate-100 active:cursor-grabbing dark:hover:bg-slate-800"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="size-4 text-slate-400" />
        </button>
      </div>
      <h3 className="mt-1 font-semibold">{deal.title}</h3>
      <p className="text-sm text-slate-500">{deal.client.name}</p>
      <p className="mt-3 font-semibold">{money.format(Number(deal.estimated_value))}</p>
    </article>
  );
}
function Column({ stage, label, deals }: { stage: string; label: string; deals: Deal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <section
      className={`w-72 shrink-0 rounded-2xl p-3 transition-colors ${isOver ? "bg-emerald-100 ring-2 ring-emerald-400 dark:bg-emerald-500/15" : "bg-slate-200 dark:bg-slate-900/80"}`}
    >
      <div className="mb-3 flex justify-between">
        <h2 className="text-sm font-bold">{label}</h2>
        <span className="rounded-full bg-white px-2 text-xs">{deals.length}</span>
      </div>
      <div ref={setNodeRef} className="min-h-32 space-y-3">
        {deals.map((d) => (
          <Card key={d.id} deal={d} />
        ))}
      </div>
    </section>
  );
}
export default function DealsPage() {
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const deals = useQuery({
    queryKey: ["deals"],
    queryFn: async () => (await axios.get<Deal[]>("/api/deals")).data,
  });
  const clients = useQuery({
    queryKey: ["clients", "deal"],
    queryFn: async () =>
      (
        await axios.get<ClientPage>("/api/clients", {
          params: { page_size: 100 },
        })
      ).data,
  });
  const properties = useQuery({
    queryKey: ["properties", "deal"],
    queryFn: async () =>
      (
        await axios.get<PropertyPage>("/api/properties", {
          params: { page_size: 100, available: true },
        })
      ).data,
  });
  const move = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      let extra = {};
      if (stage === "perdido") {
        const reason = prompt("Motivo da perda:");
        if (!reason) throw new Error("Motivo obrigatório");
        extra = { lost_reason: reason };
      }
      if (stage === "ganho") {
        const value = prompt("Valor final:");
        if (!value) throw new Error("Valor obrigatório");
        extra = { final_value: value };
      }
      return axios.post(`/api/deals/${id}/move`, { stage, ...extra });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deals"] }),
  });
  const create = useMutation({
    mutationFn: (form: FormData) => axios.post("/api/deals", Object.fromEntries(form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      setShow(false);
    },
  });
  function end(e: DragEndEvent) {
    if (e.over && e.active.data.current?.deal.stage !== e.over.id)
      move.mutate({ id: String(e.active.id), stage: String(e.over.id) });
  }
  return (
    <AdminShell>
      <div className="mb-6 flex justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Pipeline</p>
          <h1 className="text-3xl font-bold">Negociações</h1>
        </div>
        <button
          onClick={() => setShow(!show)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 font-semibold text-white"
        >
          <Plus className="size-4" /> Nova negociação
        </button>
      </div>
      {show && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(new FormData(e.currentTarget));
          }}
          className="mb-5 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-5"
        >
          <input
            className="h-11 rounded-xl border px-3"
            name="title"
            placeholder="Título"
            required
          />
          <select className="rounded-xl border px-3" name="client_id" required>
            <option value="">Cliente</option>
            {clients.data?.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select className="rounded-xl border px-3" name="property_id" required>
            <option value="">Imóvel</option>
            {properties.data?.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <input
            className="h-11 rounded-xl border px-3"
            type="number"
            step=".01"
            name="estimated_value"
            placeholder="Valor estimado"
            required
          />
          <button className="rounded-xl bg-slate-950 font-semibold text-white">Criar</button>
        </form>
      )}
      <DndContext onDragEnd={end}>
        <div className="flex gap-4 overflow-x-auto pb-5">
          {stages.map(([stage, label]) => (
            <Column
              key={stage}
              stage={stage}
              label={label}
              deals={deals.data?.filter((d) => d.stage === stage) ?? []}
            />
          ))}
        </div>
      </DndContext>
    </AdminShell>
  );
}
