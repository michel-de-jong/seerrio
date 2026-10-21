/** Encode a Seerr query value. Spaces are %20, never +. */
export function encodeQueryValue(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}
