/** @type {import('next').NextConfig} */
// next.config.js
import withPWA from 'next-pwa'

const DENON_IP = process.env.NEXT_PUBLIC_DENON_IP ?? "192.168.1.252";
const ROKU_IP = process.env.NEXT_PUBLIC_ROKU_IP ?? "192.168.1.222";
const ROKU_PORT = 8060;
const ROKU_URL = `http://${ROKU_IP}:${ROKU_PORT}`;
const DENON_HTTP_COMMAND_URL = "goform/formiPhoneAppDirect.xml";
const DENON_HTTP_QUERY_URL = "goform/formMainZone_MainZoneXml.xml";


const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
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
  webpack: (config, { isServer }) => {
    if (isServer) {
      // robotjs is a native addon — prevent webpack from trying to bundle it.
      config.externals.push('@jitsi/robotjs');
    }
    return config;
  },
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  sw: 'sw.js'
})(nextConfig)

