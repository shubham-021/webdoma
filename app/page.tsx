import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/sidebar";
import { FileBrowser } from "@/components/file-browser";

export default async function HomePage() {
  const session = await getSession();

  if (!session.username || !session.password) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <FileBrowser playerProtocol={session.playerProtocol || "vlc"} />
      </main>
    </div>
  );
}
