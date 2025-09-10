import { slugify } from './slug.util';

describe('slugify', () => {
  it('converte "Grão Direto" para "grao-direto"', () => {
    expect(slugify('Grão Direto')).toBe('grao-direto');
  });

  it('converte "Tech Blog" para "tech-blog"', () => {
    expect(slugify('Tech Blog')).toBe('tech-blog');
  });

  it('combina e limpa: "  Grão  Direto — Tech Blog!!!  " -> "grao-direto-tech-blog"', () => {
    expect(slugify('  Grão  Direto — Tech Blog!!!  ')).toBe('grao-direto-tech-blog');
  });

  it('remove acentos, colapsa separadores e tira hifens das bordas', () => {
    expect(slugify('--- Grãô  Direto___Tech+++Blog ---')).toBe('grao-direto-tech-blog');
  });

  it('retorna vazio para string vazia', () => {
    expect(slugify('')).toBe('');
  });
});
