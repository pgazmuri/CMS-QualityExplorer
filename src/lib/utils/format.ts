export function formatScore(value: number | null | undefined, decimals = 1): string {
  if (value == null) return 'N/A';
  return value.toFixed(decimals);
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return 'N/A';
  return `${value.toFixed(decimals)}%`;
}

export function formatMSPBRatio(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  const diff = ((value - 1) * 100).toFixed(1);
  const direction = value > 1 ? `+${diff}% above` : value < 1 ? `${diff}% below` : 'at';
  return `${value.toFixed(3)} (${direction} national avg)`;
}

export function formatSIR(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  return value.toFixed(3);
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null) return 'N/A';
  return value.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

/** Strip "%" suffix from CMS spending-by-claim percent strings */
export function parsePercentString(s: string | null | undefined): number | null {
  if (!s) return null;
  const num = parseFloat(String(s).replace('%', '').trim());
  return isNaN(num) ? null : num;
}

/** Parse "N out of M" HVBP score strings, e.g. "10 out of 10" */
export function parseOutOfScore(s: string | null | undefined): { numerator: number; denominator: number } | null {
  if (!s) return null;
  const match = String(s).match(/^(\d+(?:\.\d+)?)\s+out\s+of\s+(\d+(?:\.\d+)?)/i);
  if (!match) return null;
  return { numerator: parseFloat(match[1]), denominator: parseFloat(match[2]) };
}

/** Format a value based on a format string hint */
export function formatByType(
  value: unknown,
  format?: 'number' | 'percent' | 'currency' | 'date' | 'badge' | 'ratio'
): string {
  if (value == null) return 'N/A';
  const num = Number(value);
  switch (format) {
    case 'percent':  return formatPercent(isNaN(num) ? null : num);
    case 'currency': return formatCurrency(isNaN(num) ? null : num);
    case 'ratio':    return isNaN(num) ? String(value) : num.toFixed(3);
    case 'number':   return isNaN(num) ? String(value) : formatNumber(num, 1);
    default:         return String(value);
  }
}
