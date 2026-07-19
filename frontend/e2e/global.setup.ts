import { expect, request, test as setup } from "@playwright/test";
import path from "node:path";

const authFile = path.join(process.cwd(), "playwright/.auth/user.json");

setup("authenticate", async () => {
  const context = await request.newContext({
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
  });
  const response = await context.post("/api/auth/login", {
    data: {
      email: process.env.E2E_ADMIN_EMAIL ?? "admin@imobcrm.com.br",
      password: process.env.E2E_ADMIN_PASSWORD ?? "admin-local-123",
    },
  });
  expect(response.ok()).toBeTruthy();
  await context.storageState({ path: authFile });
  await context.dispose();
});
