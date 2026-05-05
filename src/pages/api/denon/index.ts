import type { NextApiRequest, NextApiResponse } from "next";

export default function denonHandler(
  _req: NextApiRequest,
  res: NextApiResponse,
): void {
  res.status(200).send({ msg: "Denon Telnet API is running" });
}
