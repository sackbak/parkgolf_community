const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateFriendCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export function friendshipId(uidA, uidB) {
  return [uidA, uidB].sort().join('_');
}
