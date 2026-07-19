import { expect, test } from "@playwright/test";

for (const [path, heading] of [
  ["/clientes", "Clientes e leads"],
  ["/imoveis", "Imóveis"],
  ["/negociacoes", "Negociações"],
  ["/visitas", "Visitas"],
  ["/tarefas", "Tarefas e lembretes"],
  ["/relatorios", "Relatórios"],
] as const) {
  test(`opens ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  });
}
