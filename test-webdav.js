import { createClient } from "webdav";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const client = createClient(process.env.NEXT_PUBLIC_WEBDAV_URL || "https://doma.sithari.workers.dev", {
    username: "1", // fake user for testing or I need real ones from .env
    password: "1"
  });
  // let's just log what we have
  console.log("created client");
}
run();
