import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/sidebar";
import { FileBrowser } from "@/components/file-browser";
import { getAccountsByUserId } from "@/lib/db";

export default async function HomePage() {
  const session = await getSession();

  if (!session.userId) {
    redirect("/login");
  }

  // Get TorBox accounts from database
  const accounts = getAccountsByUserId(session.userId);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="h-14 shrink-0 border-b border-border/50 flex items-center justify-between px-4 lg:px-6 bg-card/30 backdrop-blur-sm z-10">
          <div className="text-sm font-semibold tracking-tight text-muted-foreground hidden sm:block">
            DoMa Files
          </div>
        </div>
        <FileBrowser playerProtocol={session.playerProtocol || "vlc"} hasAccounts={accounts.length > 0} />
      </main>
    </div>
  );
}