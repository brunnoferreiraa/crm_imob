import { proxyApi } from "@/lib/api-proxy";
type Context = { params: Promise<{ path?: string[] }> };
async function handler(request: Request, context: Context) {
  const { path = [] } = await context.params;
  return proxyApi(request, "deals", path);
}
export { handler as DELETE, handler as GET, handler as PATCH, handler as POST };
