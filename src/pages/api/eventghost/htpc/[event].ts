import type { NextApiRequest, NextApiResponse } from "next";

const htpcIp = process.env.NEXT_PUBLIC_HTPC_IP ?? "";
const HTPC_EVENTGHOST_URL =
  process.env.HTPC_EVENTGHOST_URL ?? (htpcIp ? `http://${htpcIp}:3005` : "");

export default async function eventghostEventHandler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  const { event } = req.query;
  const eventName = Array.isArray(event) ? event[0] : event;
  try {
    const data = await fetch(`${HTPC_EVENTGHOST_URL}?${eventName}`);
    res.status(200).send({ data });
  } catch (error) {
    res.status(500).send({ error });
  }
}
