import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";

const USER_ID_HEADER = "x-user-id";
const USER_ID_COOKIE = "ireal_uid";
const VISITOR_ID_COOKIE = "ireal_vid";

type RequestLike = Request & {
  cookies?: {
    get(name: string): { value: string } | undefined;
  };
};

const parseCookieHeader = (
  header: string | null | undefined,
  name: string,
): string | undefined => {
  if (!header) return undefined;

  return header
    .split(";")
    .map((chunk) => chunk.trim())
    .map((chunk) => chunk.split("="))
    .find(([key]) => key === name)?.[1];
};

const readCookieFromRequest = (
  request: RequestLike,
  name: string,
): string | undefined => {
  const cookieStore = request.cookies;
  if (cookieStore) {
    const value = cookieStore.get(name)?.value;
    if (value) {
      return value;
    }
  }

  return parseCookieHeader(request.headers.get("cookie"), name);
};

const getRequestUserId = async (
  request?: RequestLike,
): Promise<string | undefined> => {
  if (request) {
    const headerUserId = request.headers.get(USER_ID_HEADER);
    if (headerUserId) {
      return headerUserId;
    }

    const cookieUserId = readCookieFromRequest(request, USER_ID_COOKIE);
    if (cookieUserId) {
      return cookieUserId;
    }

    const visitorId = readCookieFromRequest(request, VISITOR_ID_COOKIE);
    if (visitorId) {
      return `visitor:${visitorId}`;
    }
  }

  const hdr = headers();
  const headerUserId = hdr.get(USER_ID_HEADER);
  if (headerUserId) {
    return headerUserId;
  }

  const cookieJar = await cookies();
  const cookieUserId = cookieJar.get(USER_ID_COOKIE)?.value;
  if (cookieUserId) {
    return cookieUserId;
  }

  const visitorId = cookieJar.get(VISITOR_ID_COOKIE)?.value;
  if (visitorId) {
    return `visitor:${visitorId}`;
  }

  return undefined;
};

export const resolveUserIdForRateLimit = async (
  request?: Request | NextRequest | undefined,
): Promise<string> => {
  const userId = await getRequestUserId(request as RequestLike | undefined);
  return userId ?? "anonymous";
};
