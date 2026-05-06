import type { NextApiRequest, NextApiResponse } from "next";
import { runDisable } from "@/pages/api/lib/command";

export default async function handleDisable(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  try {
    await runDisable();
    res.status(200).send("Airmouse disabled and reset to defaults");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ ok: false, error: message });
  }
}
