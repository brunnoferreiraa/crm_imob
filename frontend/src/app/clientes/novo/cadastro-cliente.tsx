import Link from "next/link";

import { AdminShell } from "@/components/admin-shell";
import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
  return (
    <AdminShell>
      <div className="mb-6">
        <Link className="text-sm font-medium text-emerald-700" href="/clientes">
          ← Voltar para clientes
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Novo cliente</h1>
        <p className="text-slate-500">Cadastre o lead e suas preferências imobiliárias.</p>
      </div>
      <ClientForm />
    </AdminShell>
  );
}
