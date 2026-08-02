import { createClient } from "webdav";

async function run() {
  const client = createClient("https://doma.sithari.workers.dev", {
    username: "user", 
    password: "password"
  });
  console.log("ready");
}
run();
