/** @type {import('next').NextConfig} */
// next.config.js
import withPWA from '@ducanh2912/next-pwa'

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
// No fallback IPs — local device config is env-only. An unset IP means the
// corresponding rewrite below is simply omitted rather than pointing at a
// stale default.
const DENON_IP = process.env.NEXT_PUBLIC_DENON_IP ?? "";
const ROKU_IP = process.env.NEXT_PUBLIC_ROKU_IP ?? "";
const HOST_IP = process.env.NEXT_PUBLIC_HOST_IP ?? "";
const ROKU_PORT = 8060;
const ROKU_URL = ROKU_IP ? `http://${ROKU_IP}:${ROKU_PORT}` : "";
const DENON_HTTP_COMMAND_URL = "goform/formiPhoneAppDirect.xml";
const DENON_HTTP_QUERY_URL = "goform/formMainZone_MainZoneXml.xml";


const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  // Excludes @jitsi/robotjs (native addon) from the server bundle.
  // Works for both webpack and Turbopack (which became the default dev bundler in Next.js 15.3+).
  serverExternalPackages: ['@jitsi/robotjs'],
  // Allow the phone (network IP) to receive HMR updates in dev.
  allowedDevOrigins: HOST_IP ? [HOST_IP] : [],
  // next-pwa injects a webpack plugin even when disabled in dev/demo, which triggers
  // a "webpack config with no turbopack config" error. Empty turbopack config silences it.
  turbopack: {},
  async rewrites() {
    // Demo mode is blind to device IPs by design — it runs entirely against
    // the in-browser virtual home theater, so no device rewrites exist at all.
    if (IS_DEMO) return [];

    const rewrites = [];

    if (ROKU_URL) {
      rewrites.push({
        source: '/api/roku/:path*',
        destination: `${ROKU_URL}/:path*`
      });
    }

    if (DENON_IP) {
      rewrites.push(
        {
          source: '/api/denon-http/queryMainZone',
          destination: `http://${DENON_IP}/${DENON_HTTP_QUERY_URL}`
        },
        {
          source: '/api/denon-http/command/:cmd',
          destination: `http://${DENON_IP}/${DENON_HTTP_COMMAND_URL}%3F:cmd`
        },
      );
    }

    return rewrites;
  },
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' || IS_DEMO,
  sw: 'sw.js',
})(nextConfig)
