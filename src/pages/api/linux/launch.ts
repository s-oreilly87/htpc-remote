import type { NextApiRequest, NextApiResponse } from "next";

import type { ApiResponse } from "@/types/api";
import { LinuxLaunchAppCommand, VALID_LAUNCH_APPS } from "@/constants/htpcControls";
import { runCommand } from "../lib/command";

type LaunchBody = {
  app?: LinuxLaunchAppCommand | string;
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

  const { app } = (req.body ?? {}) as LaunchBody;
  if (!isValidApp(app)) {
    res.status(400).json({ ok: false, error: "Invalid app" });
    return;
  }

  try {
    await runCommand("htpc-launch", [app]);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ ok: false, error: message });
  }
}

function isValidApp(app: unknown): app is LinuxLaunchAppCommand {
  return typeof app === "string" && VALID_LAUNCH_APPS.includes(app as LinuxLaunchAppCommand);
}

async function killOtherApps(app: LinuxLaunchAppCommand) {
    await runCommand("htpc-kill", [app]);
}
