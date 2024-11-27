import jwt from "jsonwebtoken";

const SECRET_KEY =
  process.env.JWT_SECRET_KEY ||
  "6d4a21ab7e872f3f8d9e4e8c6a1f6b8f9d6e3c4a6f4e5b9c3e9a8f6b7c8d9e0f1";

export const generateToken = (userId: number) => {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: "1h" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET_KEY);
};
