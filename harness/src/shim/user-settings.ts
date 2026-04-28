import type { HarnessStore } from '../store/harness-store';

const LCID_TO_LOCALE: Record<number, string> = {
  1025: 'ar-SA', 1028: 'zh-TW', 1029: 'cs-CZ', 1030: 'da-DK',
  1031: 'de-DE', 1032: 'el-GR', 1033: 'en-US', 1034: 'es-ES',
  1035: 'fi-FI', 1036: 'fr-FR', 1037: 'he-IL', 1038: 'hu-HU',
  1040: 'it-IT', 1041: 'ja-JP', 1042: 'ko-KR', 1043: 'nl-NL',
  1044: 'nb-NO', 1045: 'pl-PL', 1046: 'pt-BR', 1048: 'ro-RO',
  1049: 'ru-RU', 1051: 'sk-SK', 1053: 'sv-SE', 1054: 'th-TH',
  1055: 'tr-TR', 1058: 'uk-UA', 1060: 'sl-SI', 1061: 'et-EE',
  1062: 'lv-LV', 1063: 'lt-LT', 1066: 'vi-VN', 2052: 'zh-CN',
  2057: 'en-GB', 2070: 'pt-PT', 3082: 'es-ES',
};

export const SUPPORTED_LCIDS = Object.entries(LCID_TO_LOCALE).map(([lcid, locale]) => ({
  lcid: Number(lcid),
  locale,
}));

function lcidToLocale(lcid: number): string {
  return LCID_TO_LOCALE[lcid] ?? 'en-US';
}

function deriveNumberFormattingInfo(locale: string) {
  const numberParts = new Intl.NumberFormat(locale).formatToParts(1234567.89);
  const numberDecimalSeparator = numberParts.find(p => p.type === 'decimal')?.value ?? '.';
  const numberGroupSeparator = numberParts.find(p => p.type === 'group')?.value ?? ',';

  let currencySymbol = '$';
  let currencyDecimalSeparator = numberDecimalSeparator;
  let currencyGroupSeparator = numberGroupSeparator;
  try {
    const currencyParts = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).formatToParts(1234.56);
    currencySymbol = currencyParts.find(p => p.type === 'currency')?.value ?? '$';
    currencyDecimalSeparator = currencyParts.find(p => p.type === 'decimal')?.value ?? numberDecimalSeparator;
    currencyGroupSeparator = currencyParts.find(p => p.type === 'group')?.value ?? numberGroupSeparator;
  } catch {
    // ignore
  }

  return {
    currencyDecimalDigits: 2,
    currencyDecimalSeparator,
    currencyGroupSeparator,
    currencyGroupSizes: [3],
    currencyNegativePattern: 0,
    currencyPositivePattern: 0,
    currencySymbol,
    nanSymbol: 'NaN',
    nativeDigits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    negativeInfinitySymbol: '-Infinity',
    negativeSign: '-',
    numberDecimalDigits: 2,
    numberDecimalSeparator,
    numberGroupSeparator,
    numberGroupSizes: [3],
    numberNegativePattern: 1,
    percentDecimalDigits: 2,
    percentDecimalSeparator: numberDecimalSeparator,
    percentGroupSeparator: numberGroupSeparator,
    percentGroupSizes: [3],
    percentNegativePattern: 0,
    percentPositivePattern: 0,
    percentSymbol: '%',
    perMilleSymbol: '\u2030',
    positiveInfinitySymbol: 'Infinity',
    positiveSign: '+',
  };
}

function deriveDateFormattingInfo(locale: string) {
  const dayLong = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  const dayShort = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const monthLong = new Intl.DateTimeFormat(locale, { month: 'long' });
  const monthShort = new Intl.DateTimeFormat(locale, { month: 'short' });

  // Reference dates: Jan 4 1970 was a Sunday (day 0 == Sunday)
  const dayNames: string[] = [];
  const abbreviatedDayNames: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(1970, 0, 4 + i));
    dayNames.push(dayLong.format(d));
    abbreviatedDayNames.push(dayShort.format(d));
  }

  const monthNames: string[] = [];
  const abbreviatedMonthNames: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(2000, i, 15));
    monthNames.push(monthLong.format(d));
    abbreviatedMonthNames.push(monthShort.format(d));
  }

  // Date / time separators
  const dateParts = new Intl.DateTimeFormat(locale).formatToParts(new Date(2000, 0, 2));
  const dateSeparator = dateParts.find(p => p.type === 'literal')?.value?.trim() || '/';
  const timeParts = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(new Date());
  const timeSeparator = timeParts.find(p => p.type === 'literal')?.value?.trim() || ':';

  return {
    amDesignator: 'AM',
    abbreviatedDayNames,
    abbreviatedMonthGenitiveNames: abbreviatedMonthNames,
    abbreviatedMonthNames,
    calendarWeekRule: 0,
    calendar: { minSupportedDateTime: '/Date(-62135568000000)/', maxSupportedDateTime: '/Date(253402300800000)/' },
    dateSeparator,
    dayNames,
    firstDayOfWeek: 0,
    fullDateTimePattern: 'dddd, MMMM d, yyyy h:mm:ss tt',
    longDatePattern: 'dddd, MMMM d, yyyy',
    longTimePattern: 'h:mm:ss tt',
    monthDayPattern: 'MMMM dd',
    monthGenitiveNames: monthNames,
    monthNames,
    pmDesignator: 'PM',
    shortDatePattern: 'M/d/yyyy',
    shortTimePattern: 'h:mm tt',
    sortableDateTimePattern: "yyyy'-'MM'-'dd'T'HH':'mm':'ss",
    timeSeparator,
    universalSortableDateTimePattern: "yyyy'-'MM'-'dd HH':'mm':'ss'Z'",
    yearMonthPattern: 'MMMM yyyy',
  };
}

export function createUserSettingsShim(getState: () => HarnessStore) {
  return {
    get dateFormattingInfo() {
      return deriveDateFormattingInfo(lcidToLocale(getState().userLanguageId));
    },
    get isRTL() {
      return getState().userIsRTL;
    },
    get languageId() {
      return getState().userLanguageId;
    },
    get numberFormattingInfo() {
      return deriveNumberFormattingInfo(lcidToLocale(getState().userLanguageId));
    },
    get securityRoles() {
      return getState().userSecurityRoles;
    },
    get userId() {
      return getState().userId;
    },
    get userName() {
      return getState().userName;
    },
    getTimeZoneOffsetMinutes(_date?: Date): number {
      return getState().userTimeZoneOffsetMinutes;
    },
  };
}
