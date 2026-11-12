/**
 * Same-origin proxy from the browser to the FastAPI backend.
 *
 * Adds the shared API secret on the server, so it never reaches the browser, and keeps a
 * single origin (no CORS). The proxy in src/proxy.ts has already checked the session.
 */
import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, authEnabled, verifySessionValue } from "@/lib/session";

export const maxDuration = 300; // AI processing and collection can take a while

const FORWARD_REQUEST_HEADERS = ["content-type", "accept", "x-techopps-client"];

async function forward(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  if (authEnabled() && !(await verifySessionValue(request.cookies.get(SESSION_COOKIE)?.value))) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Sign in again." } }, { status: 401 });
  }
  const { path } = await ctx.params;
  if (path[0] !== "v1") {
    return NextResponse.json({ error: { code: "not_found", message: "Unknown API path." } }, { status: 404 });
  }
  const base = process.env.API_INTERNAL_URL ?? "http://localhost:8000";
  const target = `${base}/api/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (process.env.API_SECRET) headers.set("x-techopps-secret", process.env.API_SECRET);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(280_000),
    });
  } catch {
    return NextResponse.json(
      { error: { code: "upstream_unreachable", message: "The API could not be reached. If it was asleep, try again in a minute." } },
      { status: 502 },
    );
  }
  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  return new Response(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
