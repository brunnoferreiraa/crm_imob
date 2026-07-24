"use client";
import { AdminShell } from "@/components/admin-shell";
import { ErrorState, LoadingState } from "@/components/async-state";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Plus, ShieldCheck, Trash2, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
type User = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  role: { name: string; slug: string };
  created_at: string;
};
export default function UsersPage() {
  const [show, setShow] = useState(false),
    [error, setError] = useState(""),
    qc = useQueryClient();
  const query = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await axios.get<User[]>("/api/users")).data,
  });
  const create = useMutation({
    mutationFn: (f: FormData) => axios.post("/api/users", Object.fromEntries(f)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setShow(false);
    },
    onError: (r) =>
      setError(axios.isAxiosError(r) ? r.response?.data?.detail : "Erro ao criar usuário"),
  });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      axios.patch(`/api/users/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    onError: (r) =>
      alert(axios.isAxiosError(r) ? r.response?.data?.detail : "Não foi possível excluir"),
  });
  return (
    <AdminShell>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Administração</p>
          <h1 className="text-3xl font-bold">Usuários</h1>
        </div>
        <button
          onClick={() => setShow(!show)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white"
        >
          <Plus className="size-4" />
          Novo usuário
        </button>
      </div>
      {show && (
        <form
          className="my-6 grid gap-3 rounded-2xl border bg-white p-5 dark:bg-slate-900 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            create.mutate(new FormData(e.currentTarget));
          }}
        >
          <input
            className="h-11 rounded-xl border bg-transparent px-3"
            name="full_name"
            placeholder="Nome completo *"
            required
          />
          <input
            className="h-11 rounded-xl border bg-transparent px-3"
            name="email"
            type="email"
            placeholder="E-mail *"
            required
          />
          <input
            className="h-11 rounded-xl border bg-transparent px-3"
            name="phone"
            placeholder="Telefone"
          />
          <input
            className="h-11 rounded-xl border bg-transparent px-3"
            name="password"
            type="password"
            minLength={8}
            placeholder="Senha inicial *"
            required
          />
          <select className="h-11 rounded-xl border bg-transparent px-3" name="role_slug">
            <option value="corretor">Corretor</option>
            <option value="gerente">Gerente</option>
            <option value="administrador">Administrador</option>
          </select>
          <button className="rounded-xl bg-slate-950 font-semibold text-white dark:bg-emerald-600">
            Criar usuário
          </button>
          {error && (
            <p role="alert" className="text-red-600 md:col-span-2">
              {error}
            </p>
          )}
        </form>
      )}
      {query.isLoading && <LoadingState />}
      {query.isError && (
        <ErrorState
          message="Você não possui acesso ou os usuários não puderam ser carregados."
          retry={() => query.refetch()}
        />
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {query.data?.map((user) => (
          <article key={user.id} className="rounded-2xl border bg-white p-5 dark:bg-slate-900">
            <div className="flex justify-between">
              <ShieldCheck className="text-emerald-600" />
              <span
                className={`rounded-full px-2 py-1 text-xs ${user.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
              >
                {user.is_active ? "Ativo" : "Inativo"}
              </span>
            </div>
            <h2 className="mt-4 font-semibold">{user.full_name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
            <p className="mt-3 text-sm font-medium">{user.role.name}</p>
            <div className="mt-5 flex gap-2">
              <button
                aria-label={user.is_active ? "Desativar usuário" : "Ativar usuário"}
                onClick={() =>
                  update.mutate({
                    id: user.id,
                    data: { is_active: !user.is_active },
                  })
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border p-2 text-sm"
              >
                {user.is_active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                {user.is_active ? "Desativar" : "Ativar"}
              </button>
              <button
                aria-label="Excluir usuário"
                onClick={() => confirm("Excluir este usuário?") && remove.mutate(user.id)}
                className="rounded-lg border p-2 text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
