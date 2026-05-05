import { useQuery } from "@tanstack/react-query";
import { sendRokuQuery } from "@/utilities/http";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const STORAGE_PREFIX = "rokuIcon:";
// Legacy key format used by the old blob-URL implementation — safe to remove.
const LEGACY_STORAGE_PREFIX = "channelImage";

/** One-time cleanup of stale blob URL keys left by the old implementation. */
function purgeLegacyIconCache(): void {
  try {
    const legacyKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith(LEGACY_STORAGE_PREFIX),
    );
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

if (typeof window !== "undefined") {
  purgeLegacyIconCache();
}

interface CachedIcon {
  dataUrl: string;
  cachedAt: number;
}

function readIconCache(channelId: string): CachedIcon | undefined {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${channelId}`);
    if (!raw) return undefined;
    const cached = JSON.parse(raw) as CachedIcon;
    if (Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached;
    localStorage.removeItem(`${STORAGE_PREFIX}${channelId}`);
  } catch {
    // ignore parse/storage errors
  }
  return undefined;
}

function writeIconCache(channelId: string, dataUrl: string): void {
  try {
    const entry: CachedIcon = { dataUrl, cachedAt: Date.now() };
    localStorage.setItem(`${STORAGE_PREFIX}${channelId}`, JSON.stringify(entry));
  } catch {
    // localStorage may be full — silently ignore
  }
}

async function fetchChannelIcon(channelId: string): Promise<string> {
  const response = await sendRokuQuery(`icon/${channelId}`);
  if (!response.ok) throw new Error(`No icon available for channel ${channelId}`);

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const dataUrl = `data:image/jpeg;base64,${btoa(binary)}`;
  writeIconCache(channelId, dataUrl);
  return dataUrl;
}

/**
 * Fetches and caches a Roku channel icon as a base64 data URL.
 *
 * Icons are persisted to localStorage with a 24-hour TTL, so they survive
 * page reloads without re-fetching. On subsequent loads, `initialData` injects
 * the cached URL synchronously — no loading state, no delay.
 *
 * Only runs for numeric channel IDs; HDMI-type IDs (e.g. "tvinput.hdmi1")
 * have no icon endpoint and are skipped via `enabled: false`.
 */
export function useRokuChannelIcon(channelId: string) {
  const isNumeric = !isNaN(parseInt(channelId));

  return useQuery({
    queryKey: ["rokuChannelIcon", channelId],
    queryFn: () => fetchChannelIcon(channelId),
    staleTime: CACHE_TTL_MS,
    enabled: isNumeric,
    // Inject persisted data synchronously on mount — no loading flash for cached icons.
    initialData: () => readIconCache(channelId)?.dataUrl,
    // Tell TanStack when the cached data was written so it can evaluate staleTime correctly.
    initialDataUpdatedAt: () => readIconCache(channelId)?.cachedAt,
  });
}
