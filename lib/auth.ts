import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getJwtSecret } from "./jwt";

export const AUTH_COOKIE_NAME = "authToken";
export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export async function getAuthenticatedUserId(): Promise<number | null> {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const secret = getJwtSecret();
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    return typeof payload.id === "number" &&
      Number.isSafeInteger(payload.id) &&
      payload.id > 0
      ? payload.id
      : null;
  } catch {
    return null;
  }
}
