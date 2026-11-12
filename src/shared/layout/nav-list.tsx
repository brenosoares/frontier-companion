import type { NavItem } from "./nav-item";
import { NavLink } from "./nav-link";

interface NavListProps {
  items: readonly NavItem[];
  /** Accessible name of the <nav> landmark. */
  label: string;
  /** Paths that must match exactly to be "current" (e.g. each locale home). */
  exactHrefs?: readonly string[];
  onNavigate?: () => void;
}

export function NavList({ items, label, exactHrefs = [], onNavigate }: NavListProps) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <NavLink
              href={item.href}
              exact={exactHrefs.includes(item.href)}
              {...(onNavigate && { onNavigate })}
            >
              <span aria-hidden="true" className="flex size-5 items-center justify-center">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
