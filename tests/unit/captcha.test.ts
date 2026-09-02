import { describe, expect, it } from 'vitest';
import { NoopCaptchaAdapter } from '@/lib/anti-abuse/captcha';

describe('captcha adapter', () => {
  it('allows traffic when no provider is configured', async () => {
    const adapter = new NoopCaptchaAdapter();
    await expect(adapter.verify(undefined)).resolves.toBe(true);
  });
});
