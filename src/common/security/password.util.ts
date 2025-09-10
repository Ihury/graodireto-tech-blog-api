import bcrypt from 'bcrypt';
import { AppConfig } from '../../config/app.config';

/**
 * Gera hash com bcrypt usando salt aleatório por hash.
 * - BCRYPT_SALT_ROUNDS controla o custo (padrão: 12)
 */
export async function hashPassword(plain: string): Promise<string> {
  if (!plain) throw new Error('Senha vazia.');
  const salt = await bcrypt.genSalt(AppConfig.bcrypt.saltRounds);
  return bcrypt.hash(plain, salt); // salt é embutido no hash
}

/** Compara a senha em texto puro com o hash bcrypt armazenado. */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}
