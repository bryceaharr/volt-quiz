// Game join codes: 6 chars, no ambiguous letters (no 0/O, 1/I/L), uppercase.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateGameCode(length = 6): string {
  let out = "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    out += ALPHABET[arr[i] % ALPHABET.length];
  }
  return out;
}
