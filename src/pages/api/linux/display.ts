import type { NextApiRequest, NextApiResponse } from "next";

import type { ApiResponse } from "@/types/api";
import { LinuxDisplayModeCommand, VALID_DISPLAY_MODES } from "@/constants/htpcControls";
import { runCommand } from "../lib/command";

type DisplayBody = {
  mode?: LinuxDisplayModeCommand | string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  const { mode } = (req.body ?? {}) as DisplayBody;
  if (!isValidMode(mode)) {
    res.status(400).json({ ok: false, error: "Invalid mode" });
    return;
  }

  try {
    await runCommand("htpc-res", [mode]);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ ok: false, error: message });
  }
}

function isValidMode(mode: unknown): mode is LinuxDisplayModeCommand {
  return typeof mode === "string" && VALID_DISPLAY_MODES.includes(mode as LinuxDisplayModeCommand);
}
