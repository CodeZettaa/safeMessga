import { headers } from 'next/headers';
import { hashSenderIdentifier } from '@/lib/anti-abuse/hash';
import { getServerEnv } from '@/lib/env';

/**
 * Hash the request origin immediately. The raw IP is never returned, stored,
 * or logged.
 */
export async function getHashedSenderId() {
  const env = getServerEnv();
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'unknown';
  const userAgent = headerList.get('user-agent') || 'unknown';
  const salt = env.senderHashSalt || 'dev-only-insecure-salt';
  return hashSenderIdentifier({ ip, userAgent, salt });
}
