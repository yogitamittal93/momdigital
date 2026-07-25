/**
 * Cookie helpers for auth.
 *
 * Chrome can store multiple cookies with the same name when Domain / Path /
 * host-only attributes differ (e.g. a leftover Domain=.momdigital.live cookie
 * plus a host-only api.momdigital.live cookie). The browser then sends BOTH in
 * the Cookie header. cookie-parser only exposes one value — often the stale
 * one — which makes login look like it "immediately logs you out" in a normal
 * profile while incognito (empty jar) works.
 */

/** Every value for `name` in a raw Cookie header, in appearance order. */
export function getCookieValues(
  cookieHeader: string | undefined,
  name: string,
): string[] {
  if (!cookieHeader) return [];
  const values: string[] = [];
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key === name) {
      values.push(trimmed.slice(eq + 1));
    }
  }
  return values;
}

/**
 * Prefer later values (usually the most recently set host-only cookie) but
 * callers should try all until one verifies.
 */
export function getCookieValuesPreferringLast(
  cookieHeader: string | undefined,
  name: string,
): string[] {
  const values = getCookieValues(cookieHeader, name);
  return values.slice().reverse();
}
