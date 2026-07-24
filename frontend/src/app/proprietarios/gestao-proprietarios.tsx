"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";

import { AdminShell } from "@/components/admin-shell";
import type { Owner } from "@/types/property";

export default function OwnersPage() {
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string>();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["owners", search],
    queryFn: async () =>
      (
        await axios.get<Owner[]>("/api/owners", {
          params: { search: search || undefined },
        })
      ).data,
  });
  const create = useMutation({
    mutationFn: (data: FormData) => axios.post("/api/owners", Object.fromEntries(data)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["owners"] });
      setShow(false);
    },
    onError: (reason) =>
      setError(axios.isAxiosError(reason) ? reason.response?.data?.detail : "Erro ao salvar"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/owners/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owners"] }),
    onError: (reason) =>
      alert(
        axios.isAxiosError(reason) ? reason.response?.data?.detail : "Não foi possível excluir",
      ),
  });
  return (
    <AdminShell>
      <div className="mb-7 flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Cadastros</p>
          <h1 className="text-3xl font-bold">Proprietários</h1>
        </div>
        <button
          onClick={() => setShow(!show)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white"
        >
          <Plus className="size-4" /> Novo proprietário
        </button>
      </div>
      {show && (
        <form
          className="mb-6 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            setError(undefined);
            create.mutate(new FormData(event.currentTarget));
          }}
        >
          <input
            className="h-11 rounded-xl border px-3"
            name="name"
            placeholder="Nome *"
            required
          />
          <input
            className="h-11 rounded-xl border px-3"
            name="document"
            placeholder="CPF ou CNPJ *"
            required
          />
          <input
            className="h-11 rounded-xl border px-3"
            name="email"
            type="email"
            placeholder="E-mail"
          />
          <input
            className="h-11 rounded-xl border px-3"
            name="phone"
            placeholder="Telefone *"
            required
          />
          {error && <p className="text-red-600">{error}</p>}
          <button className="h-11 rounded-xl bg-slate-950 font-semibold text-white">Salvar</button>
        </form>
      )}
      <label className="mb-4 flex items-center gap-2 rounded-xl border bg-white px-3">
        <Search className="size-4 text-slate-400" />
        <input
          className="h-11 w-full outline-none"
          placeholder="Buscar nome ou documento"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {query.data?.map((owner) => (
          <article key={owner.id} className="rounded-2xl border bg-white p-5">
            <div className="flex justify-between">
              <div>
                <h2 className="font-semibold">{owner.name}</h2>
                <p className="text-sm text-slate-500">{owner.document}</p>
              </div>
              <button
                aria-label="Excluir"
                onClick={() => confirm("Excluir proprietário?") && remove.mutate(owner.id)}
              >
                <Trash2 className="size-4 text-red-600" />
              </button>
            </div>
            <p className="mt-4 text-sm">{owner.phone}</p>
            <p className="text-sm text-slate-500">{owner.email}</p>
          </article>
        ))}
      </div>
      {query.data?.length === 0 && (
        <p className="rounded-2xl border bg-white p-10 text-center text-slate-500">
          Nenhum proprietário cadastrado.
        </p>
      )}
    </AdminShell>
  );
}
