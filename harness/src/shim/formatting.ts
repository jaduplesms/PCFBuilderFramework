export function createFormattingShim() {
  return {
    formatCurrency(value: number, precision?: number, symbol?: string): string {
      return (symbol || '$') + value.toFixed(precision ?? 2);
    },
    formatDecimal(value: number, precision?: number): string {
      return value.toFixed(precision ?? 2);
    },
    formatDateAsFilterStringInUTC(value: Date): string {
      return value.toISOString();
    },
    formatDateLong(value: Date): string {
      return value.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    },
    formatDateShort(value: Date, includeTime?: boolean): string {
      if (includeTime) return value.toLocaleString();
      return value.toLocaleDateString();
    },
    formatDateLongAbbreviated(value: Date): string {
      return value.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    },
    formatDateYearMonth(value: Date): string {
      return value.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    },
    formatInteger(value: number): string {
      return Math.round(value).toLocaleString();
    },
    formatLanguage(value: number): string {
      return value.toString();
    },
    formatTime(value: Date, _behavior: number): string {
      return value.toLocaleTimeString();
    },
    getWeekOfYear(value: Date): number {
      const d = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    },
  };
}
