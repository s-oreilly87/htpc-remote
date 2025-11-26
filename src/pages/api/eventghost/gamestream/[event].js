import {GAMESTREAM_EVENTGHOST_URL} from "@/utilities/constants.js";

export default async function eventghostEventHandler(req, res) {
  const { event } = req.query;
  let data;
  try {
    data = await fetch(`${GAMESTREAM_EVENTGHOST_URL}?${event}`);
    res.status(200).send({ data: data });
  } catch (error) {
    res.status(500).send({ error: error });
  }
}
