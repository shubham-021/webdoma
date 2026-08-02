import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function isRcloneInstalled(): Promise<boolean> {
  try {
    await execFileAsync("rclone", ["version"]);
    return true;
  } catch (e) {
    return false;
  }
}

export function getRcloneConfigName(username: string): string {
  return username.split('@')[0] + "_torbox_1";
}
