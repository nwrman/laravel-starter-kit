import { getTimeOfDayGreeting } from './utils';

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
