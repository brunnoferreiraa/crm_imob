import { expect, test } from "@playwright/test";

test("creates, finds and deletes a client", async ({ page, request }) => {
  const unique = Date.now();
  const name = `Cliente E2E ${unique}`;
  const email = `cliente.e2e.${unique}@example.com`;
  let clientId: string | undefined;

  try {
    await page.goto("/clientes/novo");
    await page.getByLabel("Nome completo *").fill(name);
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Telefone *").fill(`11${String(unique).slice(-9)}`);
    await page.locator('select[name="client_type"]').selectOption("comprador");
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/clients") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Salvar cliente" }).click();
    const createResponse = await responsePromise;
    expect(createResponse.ok(), await createResponse.text()).toBeTruthy();

    await expect(page).toHaveURL(/\/clientes\/[0-9a-f-]+$/);
    clientId = page.url().split("/").pop();
    await expect(page.getByRole("heading", { name })).toBeVisible();

    await page.goto("/clientes");
    await page.getByPlaceholder("Buscar por nome, e-mail, telefone ou CPF").fill(email);
    await expect(page.getByText(name)).toBeVisible();
  } finally {
    if (clientId) {
      const response = await request.delete(`/api/clients/${clientId}`);
      expect(response.ok()).toBeTruthy();
    }
  }
});
