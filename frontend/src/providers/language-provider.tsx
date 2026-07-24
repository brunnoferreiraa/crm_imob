"use client";
import { createContext, useContext, useEffect, useState } from "react";
type Locale = "pt" | "en";
const Context = createContext<{
  locale: Locale;
  setLocale: (v: Locale) => void;
}>({ locale: "pt", setLocale: () => {} });
const words: Record<string, string> = {
  "Visão geral": "Overview",
  Clientes: "Clients",
  Imóveis: "Properties",
  Negociações: "Deals",
  Visitas: "Visits",
  Tarefas: "Tasks",
  Relatórios: "Reports",
  Proprietários: "Owners",
  Usuários: "Users",
  Configurações: "Settings",
  "Menu principal": "Main menu",
  "Gestão imobiliária": "Real estate management",
  Operação: "Operations",
  Comercial: "Sales",
  Administração: "Administration",
  "Painel comercial": "Sales dashboard",
  "Acompanhe os principais números da sua operação.": "Track the key numbers of your operation.",
  "Leads novos": "New leads",
  "Em atendimento": "In progress",
  "Visitas agendadas": "Scheduled visits",
  "Negociações abertas": "Open deals",
  "Negócios ganhos": "Deals won",
  "Imóveis disponíveis": "Available properties",
  "Tarefas atrasadas": "Overdue tasks",
  "Volume financeiro": "Financial volume",
  "Evolução de leads": "Lead growth",
  "Funil de negociações": "Sales pipeline",
  "Atividades recentes": "Recent activity",
  "Novo cliente": "New client",
  "Clientes e leads": "Clients and leads",
  "Todos os status": "All statuses",
  Cliente: "Client",
  Contato: "Contact",
  Responsável: "Owner",
  Ações: "Actions",
  "Novo imóvel": "New property",
  Portfólio: "Portfolio",
  Finalidade: "Purpose",
  Venda: "Sale",
  Aluguel: "Rent",
  Temporada: "Short-term rental",
  "Todos os tipos": "All property types",
  Disponibilidade: "Availability",
  Disponível: "Available",
  Indisponível: "Unavailable",
  "Sem imagem": "No image",
  Pipeline: "Pipeline",
  "Nova negociação": "New deal",
  "Lead novo": "New lead",
  "Contato realizado": "Contact made",
  Qualificado: "Qualified",
  "Visita agendada": "Visit scheduled",
  "Proposta enviada": "Proposal sent",
  Negociação: "Negotiation",
  Contrato: "Contract",
  Ganho: "Won",
  Perdido: "Lost",
  Agenda: "Schedule",
  Agendar: "Schedule",
  Produtividade: "Productivity",
  "Tarefas e lembretes": "Tasks and reminders",
  Hoje: "Today",
  Próximas: "Upcoming",
  Atrasadas: "Overdue",
  "Nova tarefa": "New task",
  Baixa: "Low",
  Média: "Medium",
  Alta: "High",
  Adicionar: "Add",
  "Tudo em dia": "All caught up",
  Excluir: "Delete",
  Cancelar: "Cancel",
  Salvar: "Save",
  "Minha conta": "My account",
  "Alterar senha": "Change password",
  Notificações: "Notifications",
  Nome: "Name",
  "E-mail": "Email",
  "Tipo de imóvel": "Property type",
  Quartos: "Bedrooms",
  Observações: "Notes",
  Selecione: "Select",
  "Buscar por nome, e-mail, telefone ou CPF": "Search by name, email, phone or CPF",
  "Código, título ou bairro": "Code, title or neighborhood",
};
const originals = new WeakMap<Node, string>();
const originalAttributes = new WeakMap<HTMLElement, Map<string, string>>();
function translate(locale: Locale) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.parentElement || ["SCRIPT", "STYLE"].includes(node.parentElement.tagName)) continue;
    if (!originals.has(node)) originals.set(node, node.textContent || "");
    const source = originals.get(node) || "",
      key = source.trim();
    const translated = locale === "en" && words[key] ? source.replace(key, words[key]) : source;
    if (node.textContent !== translated) node.textContent = translated;
  }
  document.querySelectorAll<HTMLElement>("[placeholder],[title]").forEach((el) =>
    ["placeholder", "title"].forEach((attr) => {
      const current = el.getAttribute(attr);
      if (!current) return;
      let attributes = originalAttributes.get(el);
      if (!attributes) {
        attributes = new Map<string, string>();
        originalAttributes.set(el, attributes);
      }
      if (!attributes.has(attr)) attributes.set(attr, current);
      const source = attributes.get(attr)!;
      el.setAttribute(attr, locale === "en" ? words[source] || source : source);
    }),
  );
  document.documentElement.lang = locale === "en" ? "en" : "pt-BR";
}
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setValue] = useState<Locale>("pt");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem("imobcrm-language") as Locale | null;
      if (saved) setValue(saved);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    let observer: MutationObserver | undefined;
    const timer = window.setTimeout(() => {
      translate(locale);
      observer = new MutationObserver(() => translate(locale));
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
      });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [locale]);
  const setLocale = (v: Locale) => {
    localStorage.setItem("imobcrm-language", v);
    setValue(v);
  };
  return <Context.Provider value={{ locale, setLocale }}>{children}</Context.Provider>;
}
export const useLanguage = () => useContext(Context);
