import { randomUUID } from "crypto";

const SERVICE_BASE_URL =
  process.env.IREAL_SERVICE_URL ??
  process.env.AI_SERVICE_URL ??
  "http://localhost:3333";

export async function callService(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const url = new URL(path, SERVICE_BASE_URL);
  const headers = new Headers(init.headers ?? {});

  if (!headers.has("x-request-id")) {
    headers.set("x-request-id", randomUUID());
  }

  return fetch(url.toString(), { ...init, headers });
}
