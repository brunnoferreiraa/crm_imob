"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Download, Eye, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AdminShell } from "@/components/admin-shell";
import type { ClientPage } from "@/types/client";

const statusLabels: Record<string, string> = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  qualificado: "Qualificado",
  inativo: "Inativo",
};

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["clients", search, status, page],
    queryFn: async () =>
      (
        await axios.get<ClientPage>("/api/clients", {
          params: {
            search: search || undefined,
            status: status || undefined,
            page,
          },
        })
      ).data,
  });
  const remove = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/clients/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  });

  return (
    <AdminShell>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Relacionamento</p>
          <h1 className="text-3xl font-bold">Clientes e leads</h1>
          <p className="mt-1 text-slate-500">Acompanhe sua carteira e os próximos contatos.</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/clients/export.csv"
            className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 font-medium"
          >
            <Download className="size-4" /> CSV
          </a>
          <Link
            href="/clientes/novo"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white"
          >
            <Plus className="size-4" /> Novo cliente
          </Link>
        </div>
      </div>
      <div className="mb-5 grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-[1fr_220px]">
        <label className="flex items-center gap-2 rounded-xl border px-3">
          <Search className="size-4 text-slate-400" />
          <input
            className="h-11 w-full outline-none"
            placeholder="Buscar por nome, e-mail, telefone ou CPF"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <select
          className="h-11 rounded-xl border px-3"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos os status</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-white">
        {query.isLoading && (
          <p className="p-10 text-center text-slate-500">Carregando clientes...</p>
        )}
        {query.isError && (
          <p className="p-10 text-center text-red-600">Não foi possível carregar os clientes.</p>
        )}
        {query.data?.items.length === 0 && (
          <p className="p-10 text-center text-slate-500">Nenhum cliente encontrado.</p>
        )}
        {!!query.data?.items.length && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Responsável</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {query.data.items.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-semibold">{client.name}</p>
                      <p className="text-slate-500">{client.client_type}</p>
                    </td>
                    <td className="p-4">
                      <p>{client.phone}</p>
                      <p className="text-slate-500">{client.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {statusLabels[client.status] ?? client.status}
                      </span>
                    </td>
                    <td className="p-4">{client.responsible.full_name}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          aria-label="Ver cliente"
                          className="rounded-lg border p-2"
                          href={`/clientes/${client.id}`}
                        >
                          <Eye className="size-4" />
                        </Link>
                        <button
                          aria-label="Excluir cliente"
                          className="rounded-lg border p-2 text-red-600"
                          onClick={() =>
                            confirm("Excluir este cliente?") && remove.mutate(client.id)
                          }
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {query.data && query.data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span>
            Página {query.data.page} de {query.data.pages}
          </span>
          <div className="flex gap-2">
            <button
              className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40"
              disabled={page === 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Anterior
            </button>
            <button
              className="rounded-lg border bg-white px-3 py-2 disabled:opacity-40"
              disabled={page >= query.data.pages}
              onClick={() => setPage((value) => value + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
