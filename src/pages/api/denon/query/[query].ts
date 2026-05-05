import type { NextApiRequest, NextApiResponse } from "next";
import { promisify } from "util";

import denon from "@/api-modules/denon/denon-telnet";

const QUERY_NO_SPACE = [
  "PW",
  "ZM",
  "MV",
  "CV",
  "MU",
  "SI",
  "SD",
  "DC",
  "SV",
  "SLP",
  "ECO",
  "STBY",
  "MS",
];

const cmdAsync = promisify(denon.cmd).bind(denon);

export default async function queryHandler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  const { query } = req.query; //toUpperCase() // toUpperCase() probably not necessary after the constants refactor
  const queryValue = Array.isArray(query) ? query[0] : query;
  let data;
  try {
    if (QUERY_NO_SPACE.includes(queryValue)) {
      data = await cmdAsync(queryValue + "?");
    } else {
      data = await cmdAsync(queryValue + " ?");
    }
    res.status(200).send({ data });
  } catch (error) {
    res.status(500).send({ error });
  }
}
