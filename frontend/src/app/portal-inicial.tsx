import { Building2, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
      <section className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="grid gap-12 p-8 md:grid-cols-[1.2fr_0.8fr] md:p-14">
          <div>
            <div className="mb-10 flex items-center gap-3 text-emerald-400">
              <span className="rounded-xl bg-emerald-400/10 p-2">
                <Building2 aria-hidden="true" />
              </span>
              <span className="text-lg font-semibold text-white">ImobCRM</span>
            </div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Gestão imobiliária
            </p>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
              Relacionamentos melhores. Negócios mais rápidos.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Uma plataforma segura e organizada para sua equipe acompanhar clientes, imóveis e
              oportunidades em um só lugar.
            </p>
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-white/5 p-7">
            <h2 className="text-xl font-semibold">Estrutura inicial pronta</h2>
            <ul className="mt-6 space-y-4 text-slate-300">
              {[
                "Frontend Next.js 16",
                "API FastAPI",
                "PostgreSQL 17",
                "Ambiente Docker Compose",
              ].map((item) => (
                <li className="flex items-center gap-3" key={item}>
                  <CheckCircle2 className="size-5 text-emerald-400" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 border-t border-white/10 pt-6 text-sm text-slate-400">
              Etapa 1 de desenvolvimento concluída.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
