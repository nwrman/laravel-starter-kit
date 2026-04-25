import {
  formatCurrency,
  formatDateTime,
  getTimeOfDayGreeting,
  normalizeForSearch,
  slugify,
} from './utils';

describe('getTimeOfDayGreeting', () => {
  it.each([
    [6, 'Buenos días'],
    [11, 'Buenos días'],
    [12, 'Buenas tardes'],
    [17, 'Buenas tardes'],
    [18, 'Buenas noches'],
    [23, 'Buenas noches'],
    [0, 'Buenas noches'],
    [5, 'Buenas noches'],
  ])('hour %i → %s', (hour, expected) => {
    expect(getTimeOfDayGreeting(hour)).toBe(expected);
  });
});

describe('formatCurrency', () => {
  it('formats cents to MXN currency by default', () => {
    expect(formatCurrency(150000)).toBe('$1,500.00');
  });

  it('formats raw amount when fromCents is false', () => {
    expect(formatCurrency(1500, false)).toBe('$1,500.00');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats fractional cents', () => {
    expect(formatCurrency(199)).toBe('$1.99');
  });
});

describe('formatDateTime', () => {
  it('formats a date string in Spanish', () => {
    const result = formatDateTime('2024-03-15T14:30:00');
    expect(result).toBe('15 mar 2024 02:30 PM');
  });

  it('formats a Date object', () => {
    const result = formatDateTime(new Date(2024, 0, 1, 9, 5));
    expect(result).toBe('01 ene 2024 09:05 AM');
  });
});

describe('normalizeForSearch', () => {
  it('removes diacritics and lowercases', () => {
    expect(normalizeForSearch('Café')).toBe('cafe');
  });

  it('handles Spanish characters', () => {
    expect(normalizeForSearch('señor niño ÁNGEL')).toBe('senor nino angel');
  });

  it('handles plain ASCII', () => {
    expect(normalizeForSearch('Hello World')).toBe('hello world');
  });
});

describe('slugify', () => {
  it('converts to lowercase kebab-case', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips special characters', () => {
    expect(slugify('Café & Résumé!')).toBe('caf-r-sum');
  });

  it('collapses multiple separators', () => {
    expect(slugify('one   two---three')).toBe('one-two-three');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello');
  });
});
