/**
 * Converte um texto em slug ASCII: "Café com Leite!" -> "cafe-com-leite"
 */
export function slugify(input: string): string {
  if (!input) return '';

  // Decomposição canônica
  let s = input.normalize('NFKD');

  // Remove diacríticos (fallback caso \p{Diacritic} não esteja disponível)
  try {
    s = s.replace(/\p{Diacritic}/gu, '');
  } catch {
    s = s.replace(/[\u0300-\u036f]/g, '');
  }

  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // troca tudo que não é a-z/0-9 por '-'
    .replace(/^-+|-+$/g, '');    // remove hifens das bordas
}