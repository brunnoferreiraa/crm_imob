import { NextResponse } from "next/server";

const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: Request) {
  const credentials = await request.json();
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json(
      { message: data.detail ?? "Não foi possível entrar" },
      { status: response.status },
    );
  }

  const result = NextResponse.json({ user: data.user });
  const secure = process.env.NODE_ENV === "production";
  result.cookies.set("access_token", data.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: data.expires_in,
  });
  result.cookies.set("refresh_token", data.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return result;
}
