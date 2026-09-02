import { memoryStore } from '@/lib/anti-abuse/memory-store';

export type RateLimitConfig = {
  windowSeconds: number;
  maxSubmissions: number;
  cooldownSeconds: number;
  blockedAttemptsThreshold: number;
  tempBlockMinutes: number;
};

export type RateLimitDecision =
  | { ok: true }
  | { ok: false; code: 'rate_limited' | 'blocked' | 'cooldown' };

export function evaluateRateLimit(
  senderHash: string,
  config: RateLimitConfig,
  now = Date.now(),
): RateLimitDecision {
  const block = memoryStore.blocks.get(senderHash);
  if (block && block.until > now) {
    return { ok: false, code: 'blocked' };
  }

  const last = memoryStore.lastSubmission.get(senderHash);
  if (last && now - last < config.cooldownSeconds * 1000) {
    return { ok: false, code: 'cooldown' };
  }

  const windowMs = config.windowSeconds * 1000;
  const current = memoryStore.windows.get(senderHash);
  if (!current || now - current.startedAt >= windowMs) {
    memoryStore.windows.set(senderHash, { count: 1, startedAt: now });
    return { ok: true };
  }

  if (current.count >= config.maxSubmissions) {
    return { ok: false, code: 'rate_limited' };
  }

  current.count += 1;
  return { ok: true };
}

export function markSubmission(senderHash: string, now = Date.now()) {
  memoryStore.lastSubmission.set(senderHash, now);
}

export function registerRejection(senderHash: string, config: RateLimitConfig, now = Date.now()) {
  const current = memoryStore.blocks.get(senderHash);
  const rejections = (current?.rejections ?? 0) + 1;
  const until =
    rejections >= config.blockedAttemptsThreshold
      ? now + config.tempBlockMinutes * 60_000
      : current?.until ?? 0;

  memoryStore.blocks.set(senderHash, { rejections, until });
  return { rejections, blocked: until > now };
}

export function isDuplicateFingerprint(fingerprint: string, windowMs = 24 * 60 * 60 * 1000, now = Date.now()) {
  const previous = memoryStore.fingerprints.get(fingerprint);
  if (previous && now - previous < windowMs) {
    return true;
  }
  memoryStore.fingerprints.set(fingerprint, now);
  return false;
}
