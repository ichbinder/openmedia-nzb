import "dotenv/config";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 4100;
const app = createApp();

app.listen(PORT, () => {
  console.log(`[nzb] OpenMedia NZB running on http://localhost:${PORT}`);
  console.log(`[nzb] Health: http://localhost:${PORT}/health`);
  console.log(`[nzb] Storage: ${process.env.NZB_STORAGE_DIR || "./data/nzb"}`);
});
