import type { NextApiRequest, NextApiResponse } from "next";
import { ClickType } from "@/constants/remotes";
import { runClick } from "@/pages/api/lib/command";

const VALID_CLICK_TYPES = new Set<string>(Object.values(ClickType));

export default async function handleClick(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  const { type } = req.query;
  const clickType = Array.isArray(type) ? type[0] : type;

  if (!clickType || !VALID_CLICK_TYPES.has(clickType)) {
    res.status(400).send(
      `Invalid click type. Valid values: ${Object.values(ClickType).join(", ")}`,
    );
    return;
  }

  try {
    await runClick(clickType as ClickType);
    res.status(200).send(`${clickType} click`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ ok: false, error: message });
  }
}
