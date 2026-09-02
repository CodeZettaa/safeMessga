export interface CaptchaAdapter {
  verify(token: string | undefined): Promise<boolean>;
}

export class NoopCaptchaAdapter implements CaptchaAdapter {
  async verify(token?: string) {
    return !token || token.length >= 0;
  }
}

export class TurnstileCaptchaAdapter implements CaptchaAdapter {
  constructor(private readonly secret: string) {}

  async verify(token: string | undefined) {
    if (!token) return false;

    const body = new URLSearchParams({
      secret: this.secret,
      response: token,
    });

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    );

    if (!response.ok) return false;
    const payload = (await response.json()) as { success?: boolean };
    return Boolean(payload.success);
  }
}

export function createCaptchaAdapter(input: {
  enabled: boolean;
  secret?: string;
}): CaptchaAdapter {
  if (input.enabled && input.secret) {
    return new TurnstileCaptchaAdapter(input.secret);
  }
  return new NoopCaptchaAdapter();
}
