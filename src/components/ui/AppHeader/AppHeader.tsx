import Link from "next/link";
import AppLogo from "@/components/ui/icons/AppLogo";
import styles from "./AppHeader.module.css";

type AppHeaderItem = "home" | "about" | "project";

type AppHeaderProps = {
  activeItem?: AppHeaderItem;
  ariaLabel?: string;
};

const navItems: Array<{
  href: string;
  id: AppHeaderItem;
  label: string;
}> = [
  {
    href: "/",
    id: "home",
    label: "HOME",
  },
  {
    href: "/#about",
    id: "about",
    label: "ABOUT US",
  },
  {
    href: "/#project",
    id: "project",
    label: "THE PROJECT",
  },
];

export function AppHeader({
  activeItem,
  ariaLabel = "Primary navigation",
}: AppHeaderProps) {
  return (
    <header className={styles.header} aria-label={ariaLabel}>
      <Link className={`${styles.brand} type-brand`} href="/">
        <AppLogo alt="" className={styles.brandLogo} />
        <span>Zim Pulse</span>
      </Link>
      <nav className={`${styles.nav} type-action-display type-nav-display`}>
        {navItems.map((item) => {
          const isActive = activeItem === item.id;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={isActive ? styles.navLinkActive : undefined}
              href={item.href}
              key={item.id}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
