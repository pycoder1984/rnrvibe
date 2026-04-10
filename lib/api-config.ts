const TUNNEL_URL = "https://api.rnrvibe.com";
const CHECK_INTERVAL_MS = 30_000;

let tunnelUp: boolean | null = null;
let lastCheck = 0;
let checking = false;

function isClient(): boolean {
  return typeof window !== "undefined";
}

function isLocalhost(): boolean {
  return isClient() && window.location.hostname === "localhost";
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
  }
}

/**
 * Returns the API base URL synchronously.
 * - Localhost: always "" (same-origin)
 * - Production: "https://api.rnrvibe.com" when tunnel is up, "" (Vercel) when down
 *
 * Kicks off a background health check if the cached status is stale.
 */
export function getApiBase(): string {
  if (!isClient() || isLocalhost()) return "";

  const now = Date.now();
  if (now - lastCheck > CHECK_INTERVAL_MS) {
    checkTunnel();
  }

  // First load before any check completes — optimistically try the tunnel
  if (tunnelUp === null) {
    checkTunnel();
    return TUNNEL_URL;
  }

  return tunnelUp ? TUNNEL_URL : "";
}

// Eagerly check tunnel on page load so the result is ready before the first API call
if (isClient() && !isLocalhost()) {
  checkTunnel();
}
