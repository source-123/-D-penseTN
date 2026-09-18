export function formatCurrency(amount: number, options: { withSymbol?: boolean } = {}): string {
  const { withSymbol = true } = options;
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const hasDecimals = abs % 1 !== 0;
  const formatted = abs
    .toFixed(hasDecimals ? 3 : 0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    .replace('.', ',');
  return withSymbol ? `${sign}${formatted} DT` : `${sign}${formatted}`;
}
