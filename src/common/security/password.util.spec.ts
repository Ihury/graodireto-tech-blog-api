import { hashPassword, verifyPassword } from './password.util';

describe('password.util (bcrypt) — Grão Direto / Tech Blog', () => {
  const originalRounds = process.env.BCRYPT_SALT_ROUNDS;

  beforeAll(() => {
    // definir rounds menores para testes mais rápidos
    process.env.BCRYPT_SALT_ROUNDS = '4';
  });

  afterAll(() => {
    // restaurar valor original
    process.env.BCRYPT_SALT_ROUNDS = originalRounds;
  });

  it('gera hashes diferentes para a mesma senha "GraoDireto#TechBlog2025!" (salts distintos)', async () => {
    const h1 = await hashPassword('GraoDireto#TechBlog2025!');
    const h2 = await hashPassword('GraoDireto#TechBlog2025!');
    expect(h1).not.toEqual(h2);
    expect(h1).toMatch(/^\$2[aby]\$/);
    expect(h2).toMatch(/^\$2[aby]\$/);
  });

  it('valida corretamente a senha "GraoDireto#TechBlog2025!"', async () => {
    const hash = await hashPassword('GraoDireto#TechBlog2025!');
    await expect(verifyPassword('GraoDireto#TechBlog2025!', hash)).resolves.toBe(true);
    await expect(verifyPassword('senha-errada', hash)).resolves.toBe(false);
  });

  it('aceita unicode: "grão direto tech blog"', async () => {
    const hash = await hashPassword('grão direto tech blog');
    await expect(verifyPassword('grão direto tech blog', hash)).resolves.toBe(true);
    await expect(verifyPassword('grao direto tech blog', hash)).resolves.toBe(false);
  });

  it('lança erro ao hashear senha vazia', async () => {
    await expect(hashPassword('')).rejects.toThrow();
  });
});
