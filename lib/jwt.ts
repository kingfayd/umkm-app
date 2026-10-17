import { SignJWT } from "jose";

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "defaultsecret" || new TextEncoder().encode(secret).length < 32) {
    throw new Error("JWT_SECRET must be configured with a strong secret");
  }
  return new TextEncoder().encode(secret);
}

export async function createAuthToken(user: {
  id: number;
  email: string;
}): Promise<string> {
  return new SignJWT({ id: user.id, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}
