export const PLATFORM = process.env.NEXT_PUBLIC_PLATFORM ?? "";
export const SERVER_IP = process.env.NEXT_PUBLIC_SERVER_IP ?? "";
export const GAMESTREAM_IP = process.env.NEXT_PUBLIC_GAMESTREAM_IP ?? "";

export const DENON_IP = "192.168.1.252";
export const ROKU_URL = "http://192.168.1.222:8060";

export const HTPC_EVENTGHOST_URL = `http://${SERVER_IP}:3005`;
export const GAMESTREAM_EVENTGHOST_URL = `http://${GAMESTREAM_IP}:3006`;

export const DENON_HTTP_COMMAND_URL = "goform/formiPhoneAppDirect.xml";
export const DENON_HTTP_QUERY_URL = "goform/formMainZone_MainZoneXml.xml";
