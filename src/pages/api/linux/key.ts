import type { NextApiRequest, NextApiResponse } from "next";

import { ApiResponse, KeyAction, VALID_KEY_ACTIONS } from "@/constants/htpcControls";
import { runCommand } from "../lib/command";

type KeyRequestBody = {
  action?: KeyAction | string;
  text?: string;
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

  const { action, text } = (req.body ?? {}) as KeyRequestBody;

  if (!isValidKeyAction(action)) {
    res.status(400).json({ ok: false, error: "Invalid action" });
    return;
  }

  if (action === KeyAction.Type && !isValidText(text)) {
    res.status(400).json({ ok: false, error: "Text is required for type action" });
    return;
  }

  try {
    await handleHtpcAction(action, text ?? "");
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ ok: false, error: message });
  }
}

async function handleHtpcAction(action: KeyAction, text: string): Promise<void> {
  const command = "htpc-key";

  if (action === KeyAction.Type) {
    await runCommand(command, [action, text]);
    return;
  }

  await runCommand(command, [action]);
}

function isValidKeyAction(action: unknown): action is KeyAction {
  return typeof action === "string" && VALID_KEY_ACTIONS.includes(action as KeyAction);
}

function isValidText(text: unknown): text is string {
  return typeof text === "string" && text.length > 0;
}
