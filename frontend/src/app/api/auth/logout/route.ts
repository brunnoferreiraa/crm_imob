import { cookies } from "next/headers";
import { NextResponse } from "next/server";
const api = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL;
export async function POST() {
  const store = await cookies();
  const refresh = store.get("refresh_token")?.value;
  if (refresh) {
    await fetch(`${api}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
      cache: "no-store",
    }).catch(() => undefined);
  }
  const response = NextResponse.json({ message: "Sessão encerrada" });
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
  return response;
}
