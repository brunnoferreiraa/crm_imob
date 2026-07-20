"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import type { Owner } from "@/types/property";
import { propertyTypes } from "@/lib/property-types";
const input = "h-11 rounded-xl border px-3";
export default function NewPropertyPage() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const owners = useQuery({
    queryKey: ["owners"],
    queryFn: async () => (await axios.get<Owner[]>("/api/owners")).data,
  });
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(event.currentTarget));
    const payload = {
      ...raw,
      price: raw.price,
      bedrooms: Number(raw.bedrooms || 0),
      bathrooms: Number(raw.bathrooms || 0),
      parking_spaces: Number(raw.parking_spaces || 0),
      features: String(raw.features || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    };
    try {
      const { data } = await axios.post("/api/properties", payload);
      router.push(`/imoveis/${data.id}`);
    } catch (reason) {
      setError(
        axios.isAxiosError(reason)
          ? reason.response?.data?.detail
          : "Erro ao salvar",
      );
    }
  }
  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">Novo imóvel</h1>
      <p className="mb-6 text-slate-500">
        Cadastre dados comerciais, endereço e características.
      </p>
      <form
        onSubmit={submit}
        className="grid gap-4 rounded-2xl border bg-white p-6 md:grid-cols-2"
      >
        <input
          className={input}
          name="reference_code"
          placeholder="Código de referência *"
          required
        />
        <input className={input} name="title" placeholder="Título *" required />
        <select className={input} name="purpose">
          <option value="venda">Venda</option>
          <option value="aluguel">Aluguel</option>
          <option value="temporada">Temporada</option>
        </select>
        <select className={input} name="property_type" required>
          <option value="">Selecione o tipo do imóvel *</option>
          {propertyTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input
          className={input}
          name="price"
          type="number"
          step="0.01"
          placeholder="Valor *"
          required
        />
        <select className={input} name="owner_id" required>
          <option value="">Selecione o proprietário</option>
          {owners.data?.map((o) => (
            <option value={o.id} key={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <input className={input} name="street" placeholder="Rua *" required />
        <input
          className={input}
          name="number"
          placeholder="Número *"
          required
        />
        <input
          className={input}
          name="neighborhood"
          placeholder="Bairro *"
          required
        />
        <input className={input} name="city" placeholder="Cidade *" required />
        <input
          className={input}
          name="state"
          maxLength={2}
          placeholder="UF *"
          required
        />
        <input
          className={input}
          name="postal_code"
          placeholder="CEP *"
          required
        />
        <input
          className={input}
          name="bedrooms"
          type="number"
          placeholder="Quartos"
        />
        <input
          className={input}
          name="bathrooms"
          type="number"
          placeholder="Banheiros"
        />
        <input
          className={input}
          name="parking_spaces"
          type="number"
          placeholder="Vagas"
        />
        <input
          className={input}
          name="features"
          placeholder="Características separadas por vírgula"
        />
        <textarea
          className="min-h-28 rounded-xl border p-3 md:col-span-2"
          name="description"
          placeholder="Descrição"
        />
        {error && <p className="text-red-600 md:col-span-2">{error}</p>}
        <button className="h-11 rounded-xl bg-emerald-600 font-semibold text-white md:col-span-2">
          Salvar imóvel
        </button>
      </form>
    </AdminShell>
  );
}
