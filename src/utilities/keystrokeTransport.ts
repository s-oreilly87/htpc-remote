/**
 * Keystroke API transport helpers.
 *
 * Printable characters are carried in a query parameter because URL path
 * parsing treats a standalone encoded period (`%2E`) as a dot segment and
 * removes it before the request reaches Next.js.
 */
export const KEYSTROKE_QUERY_ROUTE = "input";
export const KEYSTROKE_QUERY_PARAM = "value";

export type KeystrokeQueryValue = string | string[] | undefined;

export function buildKeystrokeEndpoint(basePath: string, key: string): string {
  const query = `${KEYSTROKE_QUERY_PARAM}=${encodeURIComponent(key)}`;
  return `${basePath}/${KEYSTROKE_QUERY_ROUTE}?${query}`;
}

/**
 * Resolve the key from a Pages API route. The `/input` path is reserved for
 * query transport, so it must have an explicit value instead of falling back
 * to the literal route token.
 */
export function resolveKeystrokeRequestKey(
  routeKey: KeystrokeQueryValue,
  queryValue: KeystrokeQueryValue,
): string | undefined {
  const route = Array.isArray(routeKey) ? routeKey[0] ?? "" : routeKey ?? "";
  if (route === KEYSTROKE_QUERY_ROUTE && queryValue === undefined) {
    return undefined;
  }

  if (queryValue !== undefined) {
    return Array.isArray(queryValue) ? queryValue[0] ?? "" : queryValue;
  }

  return route;
}
