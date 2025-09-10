export type CountryCode = string; // ISO-3166-1 alpha-2, ex: 'RO', 'US'

export const COUNTRY_NAMES: Record<CountryCode, string> = {
  AF: 'Afghanistan', AL: 'Albania', DZ: 'Algeria', AD: 'Andorra', AO: 'Angola', AR: 'Argentina',
  AM: 'Armenia', AU: 'Australia', AT: 'Austria', AZ: 'Azerbaijan', BS: 'Bahamas', BH: 'Bahrain',
  BD: 'Bangladesh', BY: 'Belarus', BE: 'Belgium', BZ: 'Belize', BJ: 'Benin', BO: 'Bolivia',
  BA: 'Bosnia and Herzegovina', BW: 'Botswana', BR: 'Brazil', BG: 'Bulgaria',
  KH: 'Cambodia', CM: 'Cameroon', CA: 'Canada', CL: 'Chile', CN: 'China', CO: 'Colombia',
  CR: 'Costa Rica', HR: 'Croatia', CU: 'Cuba', CY: 'Cyprus', CZ: 'Czechia',
  DK: 'Denmark', DO: 'Dominican Republic', EC: 'Ecuador', EG: 'Egypt', SV: 'El Salvador',
  EE: 'Estonia', ET: 'Ethiopia', FI: 'Finland', FR: 'France', GE: 'Georgia', DE: 'Germany',
  GH: 'Ghana', GR: 'Greece', GT: 'Guatemala', HN: 'Honduras', HK: 'Hong Kong', HU: 'Hungary',
  IS: 'Iceland', IN: 'India', ID: 'Indonesia', IR: 'Iran', IQ: 'Iraq', IE: 'Ireland', IL: 'Israel',
  IT: 'Italy', JM: 'Jamaica', JP: 'Japan', JO: 'Jordan', KZ: 'Kazakhstan', KE: 'Kenya',
  KR: 'Korea, South', KW: 'Kuwait', LV: 'Latvia', LB: 'Lebanon', LY: 'Libya', LT: 'Lithuania',
  LU: 'Luxembourg', MY: 'Malaysia', MT: 'Malta', MX: 'Mexico', MD: 'Moldova', MC: 'Monaco',
  MN: 'Mongolia', ME: 'Montenegro', MA: 'Morocco', MZ: 'Mozambique', NL: 'Netherlands',
  NZ: 'New Zealand', NG: 'Nigeria', MK: 'North Macedonia', NO: 'Norway', OM: 'Oman',
  PK: 'Pakistan', PS: 'Palestine', PA: 'Panama', PY: 'Paraguay', PE: 'Peru', PH: 'Philippines',
  PL: 'Poland', PT: 'Portugal', PR: 'Puerto Rico', QA: 'Qatar', RO: 'Romania', RU: 'Russia',
  SA: 'Saudi Arabia', RS: 'Serbia', SG: 'Singapore', SK: 'Slovakia', SI: 'Slovenia',
  ZA: 'South Africa', ES: 'Spain', LK: 'Sri Lanka', SE: 'Sweden', CH: 'Switzerland',
  TW: 'Taiwan', TH: 'Thailand', TN: 'Tunisia', TR: 'Türkiye', UA: 'Ukraine', AE: 'United Arab Emirates',
  GB: 'United Kingdom', US: 'United States', UY: 'Uruguay', VE: 'Venezuela', VN: 'Vietnam'
  // add/adjust if you need 100% complete list
};

export const COUNTRY_CODES: CountryCode[] = Object.keys(COUNTRY_NAMES);

export function flagEmoji(countryCode: CountryCode): string {
  const cc = countryCode.toUpperCase();
  if (cc.length !== 2) return '🏴';
  const codePoints = [...cc].map(c => 0x1F1E6 - 65 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
