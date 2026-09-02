import { describe, expect, it } from 'vitest';
import { hashSenderIdentifier } from '@/lib/anti-abuse/hash';
import {
  evaluateRateLimit,
  registerRejection,
} from '@/lib/anti-abuse/rate-limit';
import { isHoneypotTriggered } from '@/lib/anti-abuse/honeypot';

const config = {
  windowSeconds: 60,
  maxSubmissions: 2,
  cooldownSeconds: 5,
  blockedAttemptsThreshold: 2,
  tempBlockMinutes: 10,
};

describe('anti-abuse', () => {
  it('hashes sender material without returning the raw IP', () => {
    const hash = hashSenderIdentifier({
      ip: '203.0.113.10',
      userAgent: 'test-agent',
      salt: 'unit-test-salt-value',
    });
    expect(hash).toHaveLength(64);
    expect(hash.includes('203.0.113.10')).toBe(false);
  });

  it('rate limits a sender after the max submissions in a window', () => {
    const first = evaluateRateLimit('abc', config, 1_000);
    const second = evaluateRateLimit('abc', config, 1_100);
    const third = evaluateRateLimit('abc', config, 1_200);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(third.ok).toBe(false);
    if (!third.ok) expect(third.code).toBe('rate_limited');
  });

  it('temporarily blocks after repeated rejections', () => {
    registerRejection('blocked-user', config, 5_000);
    const after = registerRejection('blocked-user', config, 5_100);
    expect(after.blocked).toBe(true);
    const decision = evaluateRateLimit('blocked-user', config, 5_200);
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.code).toBe('blocked');
  });

  it('treats a filled honeypot as triggered', () => {
    expect(isHoneypotTriggered('http://spam.test')).toBe(true);
    expect(isHoneypotTriggered('')).toBe(false);
  });
});
