/** @type {import('next').NextConfig} */
// next.config.js
import withPWA from '@ducanh2912/next-pwa'

const DENON_IP = process.env.NEXT_PUBLIC_DENON_IP ?? "192.168.1.252";
const ROKU_IP = process.env.NEXT_PUBLIC_ROKU_IP ?? "192.168.1.222";
const ROKU_PORT = 8060;
const ROKU_URL = `http://${ROKU_IP}:${ROKU_PORT}`;
const DENON_HTTP_COMMAND_URL = "goform/formiPhoneAppDirect.xml";
const DENON_HTTP_QUERY_URL = "goform/formMainZone_MainZoneXml.xml";


const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  // Excludes @jitsi/robotjs (native addon) from the server bundle.
  // Works for both webpack and Turbopack (which became the default dev bundler in Next.js 15.3+).
  serverExternalPackages: ['@jitsi/robotjs'],
  // Allow the phone (network IP) to receive HMR updates in dev.
  allowedDevOrigins: ['192.168.1.231'],
  // next-pwa injects a webpack plugin even when disabled in dev, which triggers a
  // "webpack config with no turbopack config" error. Empty turbopack config silences it.
  turbopack: {},
  async rewrites() {
    return [
      {
        source: '/api/roku/:path*',
        destination: `${ROKU_URL}/:path*`
      },
      {
        source: '/api/denon-http/queryMainZone',
        destination: `http://${DENON_IP}/${DENON_HTTP_QUERY_URL}`
      },
      {
        source: '/api/denon-http/command/:cmd',
        destination: `http://${DENON_IP}/${DENON_HTTP_COMMAND_URL}%3F:cmd`
      },
    ]
  },
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  sw: 'sw.js'
})(nextConfig)

