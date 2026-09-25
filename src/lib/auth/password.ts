import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// A valid bcrypt hash (cost 12) of a random string. Login verifies against it
// when the username does not exist so both failure paths take the same time.
export const DUMMY_PASSWORD_HASH =
  "$2b$12$tPMOAF/g0KBa3BSGL87y.eQzrgSbslzDylYEV6bAouDmHz3mCU5WS";
