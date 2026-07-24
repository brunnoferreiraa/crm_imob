"use client";
import { AdminShell } from "@/components/admin-shell";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Check, CheckSquare, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  due_at: string;
  status: string;
  assignee: { full_name: string };
};
export default function Tasks() {
  const [view, setView] = useState("today"),
    [deleteId, setDeleteId] = useState<string>(),
    qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["tasks"] });
  const q = useQuery({
    queryKey: ["tasks", view],
    queryFn: async () => (await axios.get<Task[]>("/api/tasks", { params: { view } })).data,
  });
  const create = useMutation({
    mutationFn: (f: FormData) => axios.post("/api/tasks", Object.fromEntries(f)),
    onSuccess: () => {
      refresh();
      toast.success("Tarefa adicionada");
    },
  });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      axios.patch(`/api/tasks/${id}`, { status }),
    onSuccess: () => {
      refresh();
      toast.success("Tarefa concluída");
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/tasks/${id}`),
    onSuccess: () => {
      refresh();
      setDeleteId(undefined);
      toast.success("Tarefa excluída");
    },
  });
  return (
    <AdminShell>
      <PageHeader
        eyebrow="Produtividade"
        title="Tarefas e lembretes"
        description="Organize seus compromissos e não perca nenhum prazo."
      />
      <div className="mb-5 flex gap-2">
        {[
          ["today", "Hoje"],
          ["upcoming", "Próximas"],
          ["overdue", "Atrasadas"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${view === v ? "bg-slate-950 text-white shadow-md dark:bg-emerald-500 dark:text-slate-950" : "border bg-white dark:bg-slate-900"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(new FormData(e.currentTarget));
          e.currentTarget.reset();
        }}
        className="surface mb-5 grid gap-3 p-4 md:grid-cols-4"
      >
        <input
          name="title"
          required
          placeholder="Nova tarefa"
          className="h-11 rounded-xl border bg-transparent px-3"
        />
        <input
          name="due_at"
          required
          type="datetime-local"
          className="h-11 rounded-xl border bg-transparent px-3"
        />
        <select name="priority" className="rounded-xl border bg-transparent px-3">
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
        </select>
        <button className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 font-semibold text-white">
          <Plus className="size-4" />
          Adicionar
        </button>
      </form>
      <div className="space-y-3">
        {q.data?.map((t) => (
          <article key={t.id} className="surface flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <h2
                className={`truncate font-medium ${t.status === "concluida" ? "text-slate-400 line-through" : ""}`}
              >
                {t.title}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(t.due_at).toLocaleString("pt-BR")} ·{" "}
                <span className="capitalize">{t.priority}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                aria-label="Concluir tarefa"
                onClick={() => update.mutate({ id: t.id, status: "concluida" })}
                className="rounded-lg border p-2 text-emerald-600 hover:bg-emerald-50"
              >
                <Check className="size-4" />
              </button>
              <button
                aria-label="Excluir tarefa"
                onClick={() => setDeleteId(t.id)}
                className="rounded-lg border p-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </article>
        ))}
        {q.data?.length === 0 && (
          <EmptyState
            icon={CheckSquare}
            title="Tudo em dia"
            description="Não há tarefas nesta visualização."
          />
        )}
      </div>
      <ConfirmDialog
        open={!!deleteId}
        title="Excluir tarefa?"
        description="Esta ação não poderá ser desfeita."
        confirmLabel="Excluir"
        danger
        busy={remove.isPending}
        onCancel={() => setDeleteId(undefined)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
      />
    </AdminShell>
  );
}
