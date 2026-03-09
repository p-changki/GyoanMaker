import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

export async function verifyPassword(
  pin: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
