
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, Menu, Package, Swords, Users, Wallet } from "lucide-react";

// Simplified NavLink for direct rendering
const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  const activeClass = isActive ? 'background: #e0e0e0;' : '';

  return (
    <li style={{ padding: '10px', listStyle: 'none' }}>
      <Link href={href} style={{ textDecoration: 'none', color: 'blue', ... (isActive && { fontWeight: 'bold' }) }}>
        {children}
      </Link>
    </li>
  );
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* --- FORCED NAVIGATION FOR DEBUGGING --- */}
      <div style={{ border: '2px solid red', padding: '10px', position: 'fixed', top: 0, left: 0, zIndex: 9999, background: 'white' }}>
        <h3 style={{ margin: 0, paddingBottom: '10px', borderBottom: '1px solid #ccc' }}>DEBUG NAVIGATION</h3>
        <ul>
          <NavLink href="/admin/dashboard"><Home className="h-4 w-4 inline-block mr-2" />Dashboard</NavLink>
          <NavLink href="/admin/matches"><Package className="h-4 w-4 inline-block mr-2" />Matches</NavLink>
          <NavLink href="/admin/users"><Users className="h-4 w-4 inline-block mr-2" />Users</NavLink>
          <NavLink href="/admin/deposits"><Wallet className="h-4 w-4 inline-block mr-2" />Deposits</NavLink>
          <NavLink href="/admin/settings"><LineChart className="h-4 w-4 inline-block mr-2" />Settings</NavLink>
        </ul>
      </div>

      {/* Original Main Content Area */}
      <main style={{ paddingTop: '200px' }}> {/* Added padding to avoid overlap with debug menu */}
        {children}
      </main>
    </div>
  );
}
