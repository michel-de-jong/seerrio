import { encodeQueryValue } from './encode';

describe('encodeQueryValue', () => {
  it.each([
    ['You\'ve Got Mail', 'You%27ve%20Got%20Mail'],
    ['star wars', 'star%20wars'],
    ['M*A*S*H', 'M%2AA%2AS%2AH'],
    ['Fast & Furious', 'Fast%20%26%20Furious'],
    ['Amélie', 'Am%C3%A9lie'],
  ])('encodes %s', (input, expected) => {
    expect(encodeQueryValue(input)).toBe(expected);
    expect(encodeQueryValue(input)).not.toContain('+');
  });
});
