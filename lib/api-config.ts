const TUNNEL_URL = "https://api.rnrvibe.com";
const CHECK_INTERVAL_MS = 30_000;
const STORAGE_KEY = "rnr-tunnel-up";

let tunnelUp: boolean | null = null;
let lastCheck = 0;
let checking = false;

function isClient(): boolean {
  return typeof window !== "undefined";
}

function isLocalhost(): boolean {
  return isClient() && window.location.hostname === "localhost";
}

/** Read last-known tunnel state from localStorage */
function loadCachedState(): void {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val !== null) tunnelUp = val === "1";
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }
}

/** Persist tunnel state to localStorage */
function saveCachedState(): void {
  try {
    localStorage.setItem(STORAGE_KEY, tunnelUp ? "1" : "0");
  } catch {
    // ignore
  }
}

async function checkTunnel(): Promise<void> {
  if (checking) return;
  checking = true;
  try {
    const res = await fetch(`${TUNNEL_URL}/api/health`, {
      signal: AbortSignal.timeout(4000),
    });
    tunnelUp = res.ok;
  } catch {
    tunnelUp = false;
  } finally {
    lastCheck = Date.now();
    checking = false;
    saveCachedState();
  }
}

/**
 * Returns the API base URL synchronously.
 * - Localhost: always "" (same-origin)
 * - Production: "https://api.rnrvibe.com" when tunnel is up, "" (Vercel) when down
 *
 * Kicks off a background health check if the cached status is stale.
 * Uses localStorage to remember tunnel state across page loads.
 */
export function getApiBase(): string {
  if (!isClient() || isLocalhost()) return "";

  const now = Date.now();
  if (now - lastCheck > CHECK_INTERVAL_MS) {
    checkTunnel();
  }

  // Default to Vercel (safe) when state is completely unknown
  if (tunnelUp === null) return "";

  return tunnelUp ? TUNNEL_URL : "";
}

// On page load: restore cached state, then start a fresh check
if (isClient() && !isLocalhost()) {
  loadCachedState();
  checkTunnel();
}
