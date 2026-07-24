"use client";
import { AdminShell } from "@/components/admin-shell";
import type { ClientPage } from "@/types/client";
import type { PropertyPage } from "@/types/property";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CalendarDays, ChevronLeft, ChevronRight, List, Plus } from "lucide-react";
import { useMemo, useState } from "react";
type Visit = {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  client: { name: string };
  property: { title: string };
  broker: { full_name: string };
};
export default function Visits() {
  const [show, setShow] = useState(false),
    [mode, setMode] = useState<"calendar" | "list">("calendar"),
    [month, setMonth] = useState(() => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }),
    qc = useQueryClient();
  const q = useQuery({
    queryKey: ["visits"],
    queryFn: async () => (await axios.get<Visit[]>("/api/visits")).data,
  });
  const clients = useQuery({
    queryKey: ["clients", "visit"],
    queryFn: async () =>
      (
        await axios.get<ClientPage>("/api/clients", {
          params: { page_size: 100 },
        })
      ).data,
  });
  const props = useQuery({
    queryKey: ["properties", "visit"],
    queryFn: async () =>
      (
        await axios.get<PropertyPage>("/api/properties", {
          params: { page_size: 100 },
        })
      ).data,
  });
  const create = useMutation({
    mutationFn: (f: FormData) => axios.post("/api/visits", Object.fromEntries(f)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      setShow(false);
    },
  });
  const days = useMemo(() => {
    const start = new Date(month);
    start.setDate(1 - start.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [month]);
  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Agenda</p>
          <h1 className="text-3xl font-bold">Visitas</h1>
        </div>
        <div className="flex gap-2">
          <button
            aria-label="Alternar visualização"
            onClick={() => setMode(mode === "calendar" ? "list" : "calendar")}
            className="rounded-xl border bg-white px-3 dark:bg-slate-900"
          >
            {mode === "calendar" ? <List /> : <CalendarDays />}
          </button>
          <button
            onClick={() => setShow(!show)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 font-semibold text-white"
          >
            <Plus />
            Agendar
          </button>
        </div>
      </div>
      {show && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(new FormData(e.currentTarget));
          }}
          className="mb-5 grid gap-3 rounded-2xl border bg-white p-4 dark:bg-slate-900 md:grid-cols-4"
        >
          <select name="client_id" required className="rounded-xl border bg-transparent px-3">
            <option value="">Cliente</option>
            {clients.data?.items.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
          <select name="property_id" required className="rounded-xl border bg-transparent px-3">
            <option value="">Imóvel</option>
            {props.data?.items.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title}
              </option>
            ))}
          </select>
          <input
            name="scheduled_at"
            type="datetime-local"
            required
            className="h-11 rounded-xl border bg-transparent px-3"
          />
          <button className="rounded-xl bg-slate-950 text-white dark:bg-emerald-600">Salvar</button>
        </form>
      )}
      {mode === "calendar" ? (
        <section className="overflow-hidden rounded-2xl border bg-white dark:bg-slate-900">
          <header className="flex items-center justify-between border-b p-4">
            <button
              aria-label="Mês anterior"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}
            >
              <ChevronLeft />
            </button>
            <h2 className="font-semibold capitalize">
              {month.toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button
              aria-label="Próximo mês"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}
            >
              <ChevronRight />
            </button>
          </header>
          <div className="grid grid-cols-7 border-b text-center text-xs font-semibold text-slate-500">
            {"DSTQQSS".split("").map((x, i) => (
              <span className="py-2" key={i}>
                {x}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const visits =
                q.data?.filter(
                  (v) => new Date(v.scheduled_at).toDateString() === d.toDateString(),
                ) ?? [];
              return (
                <div
                  key={d.toISOString()}
                  className={`min-h-24 border-b border-r p-1.5 ${d.getMonth() !== month.getMonth() ? "opacity-40" : ""}`}
                >
                  <span className="text-xs">{d.getDate()}</span>
                  {visits.map((v) => (
                    <div
                      title={`${v.client.name} · ${v.property.title}`}
                      key={v.id}
                      className="mt-1 truncate rounded bg-emerald-100 px-1.5 py-1 text-[11px] text-emerald-900"
                    >
                      {new Date(v.scheduled_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      {v.client.name}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="space-y-3">
          {q.data?.map((v) => (
            <article
              key={v.id}
              className="flex flex-col justify-between gap-3 rounded-2xl border bg-white p-5 dark:bg-slate-900 sm:flex-row"
            >
              <div>
                <h2 className="font-semibold">
                  {v.client.name} · {v.property.title}
                </h2>
                <p className="text-sm text-slate-500">Corretor: {v.broker.full_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="text-emerald-600" />
                <span>{new Date(v.scheduled_at).toLocaleString("pt-BR")}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
                  {v.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
