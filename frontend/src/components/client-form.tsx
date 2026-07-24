"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { propertyTypes } from "@/lib/property-types";
import { clientSchema, type ClientFormInput, type ClientFormOutput } from "@/schemas/client";

const inputClass =
  "h-11 w-full rounded-xl border bg-white px-3 outline-none focus:border-emerald-500";

export function ClientForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormInput, unknown, ClientFormOutput>({
    resolver: zodResolver(clientSchema),
    defaultValues: { client_type: "comprador", status: "novo" },
  });
  const mutation = useMutation({
    mutationFn: (values: ClientFormOutput) =>
      axios.post("/api/clients", {
        name: values.name,
        email: values.email || null,
        phone: values.phone,
        whatsapp: values.whatsapp || null,
        cpf: values.cpf || null,
        client_type: values.client_type,
        lead_source: values.lead_source || null,
        status: values.status,
        notes: values.notes || null,
        interest: {
          property_type: values.property_type || null,
          budget_min: values.budget_min,
          budget_max: values.budget_max,
          bedrooms: values.bedrooms,
          cities:
            values.cities
              ?.split(",")
              .map((item) => item.trim())
              .filter(Boolean) ?? [],
          neighborhoods:
            values.neighborhoods
              ?.split(",")
              .map((item) => item.trim())
              .filter(Boolean) ?? [],
        },
      }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      router.push(`/clientes/${response.data.id}`);
    },
    onError: (error) =>
      setServerError(
        axios.isAxiosError(error)
          ? (error.response?.data?.detail ?? "Não foi possível salvar")
          : "Não foi possível salvar",
      ),
  });

  const field = (label: string, name: keyof ClientFormInput, type = "text") => (
    <div>
      <label className="mb-1.5 block text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <input id={name} type={type} className={inputClass} {...register(name)} />
      {errors[name] && <p className="mt-1 text-sm text-red-600">{String(errors[name]?.message)}</p>}
    </div>
  );

  return (
    <form
      className="space-y-7"
      onSubmit={handleSubmit((values) => {
        setServerError(undefined);
        mutation.mutate(values);
      })}
    >
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="mb-5 text-lg font-semibold">Dados pessoais</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {field("Nome completo *", "name")}
          {field("E-mail", "email", "email")}
          {field("Telefone *", "phone")}
          {field("WhatsApp", "whatsapp")}
          {field("CPF", "cpf")}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Tipo *</label>
            <select className={inputClass} {...register("client_type")}>
              <option value="comprador">Comprador</option>
              <option value="locatario">Locatário</option>
              <option value="proprietario">Proprietário</option>
              <option value="investidor">Investidor</option>
            </select>
          </div>
          {field("Origem do lead", "lead_source")}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Status</label>
            <select className={inputClass} {...register("status")}>
              <option value="novo">Novo</option>
              <option value="em_atendimento">Em atendimento</option>
              <option value="qualificado">Qualificado</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>
      </section>
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="mb-5 text-lg font-semibold">Interesse imobiliário</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Tipo de imóvel</label>
            <select className={inputClass} {...register("property_type")}>
              <option value="">Selecione</option>
              {propertyTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {field("Quartos", "bedrooms", "number")}
          {field("Orçamento mínimo", "budget_min", "number")}
          {field("Orçamento máximo", "budget_max", "number")}
          {field("Cidades (separadas por vírgula)", "cities")}
          {field("Bairros (separados por vírgula)", "neighborhoods")}
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium">Observações</label>
          <textarea
            className="min-h-28 w-full rounded-xl border p-3 outline-none focus:border-emerald-500"
            {...register("notes")}
          />
        </div>
      </section>
      {serverError && <p className="rounded-xl bg-red-50 p-3 text-red-700">{serverError}</p>}
      <div className="flex justify-end">
        <button
          disabled={mutation.isPending}
          className="flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 font-semibold text-white disabled:opacity-60"
        >
          {mutation.isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}{" "}
          Salvar cliente
        </button>
      </div>
    </form>
  );
}
