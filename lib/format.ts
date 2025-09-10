const nf = new Intl.NumberFormat('en-US');
export function formatScore(n: number): string {
  return nf.format(Math.max(0, Math.floor(n || 0)));
}
