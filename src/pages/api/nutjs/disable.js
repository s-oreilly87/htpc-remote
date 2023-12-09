import { initializeState } from "@/api-modules/nutjs/nut-state.js";

export default function handleDisable(req, res) {
  initializeState();

  console.log("NUTJS: Airmouse reset to defaults");
  res.send("Airmouse disabled and reset to defaults");
}
