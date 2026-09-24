import Image from "next/image";
import Link from "next/link";

type AppShellProps = {
  current: "overview" | "evidence" | "decision" | "guide";
  children: React.ReactNode;
};

const primaryLinks = [
  { key: "overview", href: "/", label: "Today", shortLabel: "Today" },
  { key: "evidence", href: "/evidence", label: "Evidence", shortLabel: "Evidence" },
  { key: "decision", href: "/decision", label: "Restock plan", shortLabel: "Plan" },
  { key: "guide", href: "/guide", label: "How to use", shortLabel: "Guide" },
] as const;

export function AppShell({ current, children }: AppShellProps) {
  return (
    <div className="appShell">
      <aside className="sideNav" aria-label="Primary navigation">
        <Link className="sideBrand" href="/" aria-label="KasiStock AI home">
          <span className="sideBrandMark">
            <Image src="/kasistock-logo.png" alt="" width={34} height={34} priority />
          </span>
          <span>
            <strong>KasiStock</strong>
            <small>Restock desk</small>
          </span>
        </Link>

        <nav className="sideNavLinks">
          <p>Workspace</p>
          {primaryLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={current === link.key ? "active" : undefined}
              aria-current={current === link.key ? "page" : undefined}
            >
              <span className={`navIcon navIcon-${link.key}`} aria-hidden="true" />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sideNavSupport">
          <p>Reference</p>
          <Link href="/architecture">How decisions work</Link>
          <Link href="/judge">Demo guide</Link>
        </div>

        <div className="merchantIdentity">
          <span>NS</span>
          <div>
            <strong>Ndlovu Spaza</strong>
            <small>Soweto · Owner</small>
          </div>
        </div>
      </aside>

      <div className="appMain">
        <header className="mobileHeader">
          <Link className="mobileBrand" href="/">
            <span className="sideBrandMark">
              <Image src="/kasistock-logo.png" alt="" width={30} height={30} priority />
            </span>
            <strong>KasiStock</strong>
          </Link>
          <span className="liveIndicator">
            <i /> Demo workspace
          </span>
        </header>

        <main id="main-content">{children}</main>

        <nav className="mobileDock" aria-label="Primary mobile navigation">
          {primaryLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={current === link.key ? "active" : undefined}
              aria-current={current === link.key ? "page" : undefined}
            >
              <span className={`navIcon navIcon-${link.key}`} aria-hidden="true" />
              {link.shortLabel}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
