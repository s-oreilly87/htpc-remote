import denon from "@/api-modules/denon/denon-telnet.js";
import { promisify } from "util";

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

export default async function queryHandler(req, res) {
  const { query } = req.query; //toUpperCase() // toUpperCase() probably not necessary after the constants refactor
  let data;
  try {
    if (QUERY_NO_SPACE.includes(query)) {
      data = await cmdAsync(query + "?");
    } else {
      data = await cmdAsync(query + " ?");
    }
    res.status(200).send({ data: data });
  } catch (error) {
    res.status(500).send({ error: error });
  }
}
