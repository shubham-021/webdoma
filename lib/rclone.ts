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

// Get the rclone config name from the account record
// This is stored in the database as <username>_torbox_<n>
export function getRcloneConfigName(configName: string): string {
  return configName;
}