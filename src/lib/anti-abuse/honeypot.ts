export function isHoneypotTriggered(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}
