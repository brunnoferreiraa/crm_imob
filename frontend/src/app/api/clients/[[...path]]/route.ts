import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const apiUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL;

async function forward(request: Request, path: string[]) {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const url = new URL(request.url);
  const target = `${apiUrl}/clients${path.length ? `/${path.join("/")}` : ""}${url.search}`;
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();

  async function callApi(token?: string) {
    const headers = new Headers();
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
  }

  let response = await callApi(accessToken);
  let rotatedRefresh: string | undefined;
  if (response.status === 401 && refreshToken) {
    const refreshResponse = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (refreshResponse.ok) {
      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;
      rotatedRefresh = tokens.refresh_token;
      response = await callApi(accessToken);
    }
  }

  const result = new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json",
      ...(response.headers.get("content-disposition") && {
        "Content-Disposition": response.headers.get("content-disposition")!,
      }),
    },
  });
  if (rotatedRefresh && accessToken) {
    const secure = process.env.NODE_ENV === "production";
    result.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 1800,
    });
    result.cookies.set("refresh_token", rotatedRefresh, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });
  }
  return result;
}

type Context = { params: Promise<{ path?: string[] }> };

async function handler(request: Request, context: Context) {
  const { path = [] } = await context.params;
  return forward(request, path);
}

export { handler as DELETE, handler as GET, handler as PATCH, handler as POST };
