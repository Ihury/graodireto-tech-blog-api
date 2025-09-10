import bcrypt from 'bcryptjs';

/**
 * Gera hash com bcrypt usando salt aleatório por hash.
 * - BCRYPT_SALT_ROUNDS controla o custo (padrão: 12)
 */
export async function hashPassword(plain: string): Promise<string> {
  if (!plain) throw new Error('Senha vazia.');
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
  const salt = await bcrypt.genSalt(rounds); // salt aleatório por hash
  return bcrypt.hash(plain, salt); // salt é embutido no hash
}

/** Compara a senha em texto puro com o hash bcrypt armazenado. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}
