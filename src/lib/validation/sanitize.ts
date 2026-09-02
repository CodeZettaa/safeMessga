/**
 * Strip HTML and dangerous payloads while keeping plain-text code snippets.
 * Never treat the result as HTML — always render as text.
 */
export function stripHtml(input: string) {
  return input
    .replace(/<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*style[\s\S]*?>[\s\S]*?<\s*\/\s*style\s*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/\u0000/g, '')
    .trim();
}

export function containsUnsafeHtml(input: string) {
  return /<[^>]+>/.test(input) || /javascript:/i.test(input);
}

export function stripPrivateContact(
  text: string,
  privateValues: Array<string | null | undefined>,
) {
  let next = text;
  for (const value of privateValues) {
    if (!value) continue;
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    next = next.replace(new RegExp(escaped, 'gi'), '');
  }
  return next.replace(/\s{2,}/g, ' ').trim();
}

export function looksLikeEmail(value: string) {
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);
}

export function looksLikeLinkedIn(value: string) {
  return /linkedin\.com/i.test(value);
}
