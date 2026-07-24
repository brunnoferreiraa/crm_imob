"use client";
import { AdminShell } from "@/components/admin-shell";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { KeyRound, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
const schema = z
  .object({
    current: z.string().min(1, "Informe a senha atual"),
    password: z.string().min(8, "Use pelo menos 8 caracteres"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "As senhas não conferem",
  });
type Form = z.infer<typeof schema>;
export default function Settings() {
  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await axios.get("/api/auth/me")).data,
  });
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });
  async function submit(data: Form) {
    try {
      const response = await axios.post("/api/auth/change-password", {
        current_password: data.current,
        new_password: data.password,
      });
      setMessage(response.data.message);
      reset();
    } catch (reason) {
      setMessage(
        axios.isAxiosError(reason) ? reason.response?.data?.detail : "Não foi possível alterar",
      );
    }
  }
  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">Configurações</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-6 dark:bg-slate-900">
          <UserRound className="mb-4 text-emerald-600" />
          <h2 className="text-lg font-semibold">Minha conta</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Nome</dt>
              <dd>{me.data?.full_name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">E-mail</dt>
              <dd>{me.data?.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Perfil</dt>
              <dd>{me.data?.role.name}</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-2xl border bg-white p-6 dark:bg-slate-900">
          <KeyRound className="mb-4 text-emerald-600" />
          <h2 className="text-lg font-semibold">Alterar senha</h2>
          <form onSubmit={handleSubmit(submit)} className="mt-4 space-y-3">
            <Password
              label="Senha atual"
              error={errors.current?.message}
              bind={register("current")}
            />
            <Password
              label="Nova senha"
              error={errors.password?.message}
              bind={register("password")}
            />
            <Password
              label="Confirmar nova senha"
              error={errors.confirm?.message}
              bind={register("confirm")}
            />
            {message && (
              <p role="status" className="text-sm text-emerald-700">
                {message}
              </p>
            )}
            <button
              disabled={isSubmitting}
              className="h-11 rounded-xl bg-emerald-600 px-5 font-semibold text-white"
            >
              Alterar senha
            </button>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}
function Password({
  label,
  error,
  bind,
}: {
  label: string;
  error?: string;
  bind: UseFormRegisterReturn;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        className="mt-1 h-11 w-full rounded-xl border bg-transparent px-3"
        type="password"
        {...bind}
      />
      {error && <small className="text-red-600">{error}</small>}
    </label>
  );
}
