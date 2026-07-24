import { proxyApi } from "@/lib/api-proxy";
type C = { params: Promise<{ path?: string[] }> };
async function h(r: Request, c: C) {
  const { path = [] } = await c.params;
  return proxyApi(r, "users", path);
}
export { h as DELETE, h as GET, h as PATCH, h as POST };
