const SERVICE_BASE_URL =
  process.env.IREAL_SERVICE_URL ??
  process.env.AI_SERVICE_URL ??
  "http://localhost:3333"

export async function callService(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const url = new URL(path, SERVICE_BASE_URL)
  return fetch(url.toString(), init)
}
