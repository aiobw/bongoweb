export function getSecurityCodeRemainingSeconds(): number {
  const period = 300; // 5 minutes (300 seconds)
  const now = Math.floor(Date.now() / 1000);
  return period - (now % period);
}

export function formatRemainingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function getClientSecurityCode(identifier?: string | null): string {
  if (!identifier) return '';
  const period = 300;
  const timeStep = Math.floor(Math.floor(Date.now() / 1000) / period);
  let hash = 0;
  const str = `${identifier.trim().toLowerCase()}_BONGO_SEC_${timeStep}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  const code = (100000 + (positive % 900000)).toString();
  return `${code.slice(0, 3)}-${code.slice(3, 6)}`;
}
