/** @type {import('next').NextConfig} */
// next.config.js
import Constants, {
  DENON_HTTP_COMMAND_URL,
  DENON_HTTP_QUERY_URL,
  DENON_IP,
  EVENTGHOST_URL,
  ROKU_URL
} from "./src/utilities/constants.js"


const nextConfig = {
  reactStrictMode: false,
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
      {
        source: '/api/eventghost/:path*',
        destination: `${EVENTGHOST_URL}/:path*`
      },
    ]
  },
}

export default nextConfig

