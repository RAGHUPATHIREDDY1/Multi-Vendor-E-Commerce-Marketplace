export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount) || 0);
}

export function formatMinorUnits(amount, currency = 'INR') {
  return formatCurrency((Number(amount) || 0) / 100, currency);
}
