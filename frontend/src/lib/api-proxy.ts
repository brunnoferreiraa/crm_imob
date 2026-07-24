import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL;

export async function proxyApi(request: Request, resource: string, path: string[]) {
  const store = await cookies();
  let access = store.get("access_token")?.value;
  const refresh = store.get("refresh_token")?.value;
  const incoming = new URL(request.url);
  const target = `${apiUrl}/${resource}${path.length ? `/${path.join("/")}` : ""}${incoming.search}`;
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();
  const call = (token?: string) =>
    fetch(target, {
      method: request.method,
      headers: {
        ...(request.headers.get("content-type") && {
          "Content-Type": request.headers.get("content-type")!,
        }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body,
      cache: "no-store",
    });
  let response = await call(access);
  let newRefresh: string | undefined;
  if (response.status === 401 && refresh) {
    const refreshed = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
      cache: "no-store",
    });
    if (refreshed.ok) {
      const tokens = await refreshed.json();
      access = tokens.access_token;
      newRefresh = tokens.refresh_token;
      response = await call(access);
    }
  }
  const result = new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
    },
  });
  if (access && newRefresh) {
    const secure = process.env.NODE_ENV === "production";
    result.cookies.set("access_token", access, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 1800,
    });
    result.cookies.set("refresh_token", newRefresh, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });
  }
  return result;
}
