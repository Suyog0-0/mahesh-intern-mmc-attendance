import { requirePageSession } from "@/lib/auth/page-guards";
import { NavShell } from "@/components/nav-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageSession();
  return (
    <NavShell user={{ name: session.name, username: session.username, role: session.role }}>
      {children}
    </NavShell>
  );
}
