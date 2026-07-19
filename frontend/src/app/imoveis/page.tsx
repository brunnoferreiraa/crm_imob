"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { BedDouble, MapPin, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import type { PropertyPage } from "@/types/property";
import { propertyTypes, propertyTypeLabel } from "@/lib/property-types";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
export default function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [purpose, setPurpose] = useState("");
  const [type, setType] = useState("");
  const [available, setAvailable] = useState("");
  const query = useQuery({
    queryKey: ["properties", search, purpose, type, available],
    queryFn: async () =>
      (
        await axios.get<PropertyPage>("/api/properties", {
          params: {
            search: search || undefined,
            purpose: purpose || undefined,
            property_type: type || undefined,
            available: available || undefined,
          },
        })
      ).data,
  });
  return (
    <AdminShell>
      <div className="mb-7 flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Portfólio</p>
          <h1 className="text-3xl font-bold">Imóveis</h1>
        </div>
        <Link
          href="/imoveis/novo"
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white"
        >
          <Plus className="size-4" /> Novo imóvel
        </Link>
      </div>
      <div className="mb-5 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_180px_200px_180px]">
        <label className="flex items-center gap-2 rounded-xl border px-3">
          <Search className="size-4" />
          <input
            className="h-11 w-full outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Código, título ou bairro"
          />
        </label>
        <select
          className="rounded-xl border px-3"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        >
          <option value="">Finalidade</option>
          <option value="venda">Venda</option>
          <option value="aluguel">Aluguel</option>
          <option value="temporada">Temporada</option>
        </select>
        <select className="rounded-xl border px-3" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Todos os tipos</option>
          {propertyTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select
          className="rounded-xl border px-3"
          value={available}
          onChange={(e) => setAvailable(e.target.value)}
        >
          <option value="">Disponibilidade</option>
          <option value="true">Disponível</option>
          <option value="false">Indisponível</option>
        </select>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {query.data?.items.map((item) => (
          <Link
            href={`/imoveis/${item.id}`}
            key={item.id}
            className="overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex h-40 items-center justify-center bg-slate-200 text-slate-400">
              {item.images.length
                ? `${item.images.length} imagens`
                : "Sem imagem"}
            </div>
            <div className="p-5">
              <div className="flex justify-between text-xs font-semibold uppercase text-emerald-700">
                <span>{item.reference_code}</span>
                <span>{item.purpose}</span>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-400">{propertyTypeLabel(item.property_type)}</p>
              <h2 className="mt-1 text-lg font-semibold">{item.title}</h2>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="size-4" /> {item.neighborhood}, {item.city}
              </p>
              <div className="mt-5 flex items-end justify-between">
                <strong>{money.format(Number(item.price))}</strong>
                <span className="flex items-center gap-1 text-sm">
                  <BedDouble className="size-4" /> {item.bedrooms}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {query.data?.total === 0 && (
        <p className="rounded-2xl border bg-white p-10 text-center text-slate-500">
          Nenhum imóvel encontrado.
        </p>
      )}
    </AdminShell>
  );
}
