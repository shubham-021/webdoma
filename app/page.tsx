import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/sidebar";
import { FileBrowser } from "@/components/file-browser";
import { TorrentChecker } from "@/components/torrent-checker";
import { OnboardingNotifier } from "@/components/onboarding-notifier";
import { getAccountsByUserId, getUserById } from "@/lib/db";

export default async function HomePage() {
  const session = await getSession();

  if (!session.userId) {
    redirect("/login");
  }

  const user = getUserById(session.userId);
  const accounts = getAccountsByUserId(session.userId);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar username={user?.username} />
      <main className="flex-1 overflow-hidden flex flex-col">
        <FileBrowser playerProtocol={session.playerProtocol || "mpv"} hasAccounts={accounts.length > 0} />
      </main>
      <TorrentChecker hasAccounts={accounts.length > 0} accounts={accounts} />
      <OnboardingNotifier tmdbApiKey={user?.tmdb_api_key} hasAccounts={accounts.length > 0} />
    </div>
  );
}
