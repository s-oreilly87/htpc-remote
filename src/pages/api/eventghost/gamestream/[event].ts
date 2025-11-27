import type { NextApiRequest, NextApiResponse } from "next";

const gamestreamIp = process.env.GAMESTREAM_IP ?? process.env.NEXT_PUBLIC_GAMESTREAM_IP ?? "";
const GAMESTREAM_EVENTGHOST_URL =
  process.env.GAMESTREAM_EVENTGHOST_URL ??
  (gamestreamIp ? `http://${gamestreamIp}:3006` : "");

export default async function eventghostEventHandler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  const { event } = req.query;
  const eventName = Array.isArray(event) ? event[0] : event;
  try {
    const data = await fetch(`${GAMESTREAM_EVENTGHOST_URL}?${eventName}`);
    res.status(200).send({ data });
  } catch (error) {
    res.status(500).send({ error });
  }
}
