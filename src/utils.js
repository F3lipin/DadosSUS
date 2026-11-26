export const numberFormat = new Intl.NumberFormat("pt-BR");
export const decimalFormat = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits:1, maximumFractionDigits:1
});
export function formatVariation(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value > 0 ? "+" : ""}${decimalFormat.format(value)}%`;
}
