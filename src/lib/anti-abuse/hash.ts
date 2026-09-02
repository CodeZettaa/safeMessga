import { createHash, randomBytes } from 'node:crypto';
import { customAlphabet } from 'nanoid';

const referenceAlphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const nanoid = customAlphabet(referenceAlphabet, 8);

export function hashSenderIdentifier(input: {
  ip: string | undefined;
  userAgent: string | undefined;
  salt: string;
}) {
  const material = `${input.ip ?? 'unknown'}|${input.userAgent ?? 'unknown'}`;
  return createHash('sha256').update(input.salt).update(material).digest('hex');
}

export function hashMessageFingerprint(compactMessage: string, salt: string) {
  return createHash('sha256').update(salt).update(compactMessage).digest('hex');
}

export function createReferenceCode() {
  return `AN-${nanoid()}`;
}

export function randomSalt(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}
