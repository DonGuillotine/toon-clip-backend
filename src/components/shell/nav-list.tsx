import { DevBadge, DevOnly } from "@/features/dev-mode/components/dev-mode";

import { NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav";

/**
 * Server component. Icons are rendered here and passed down as elements:
 * a component (a function) cannot cross into a client component, an element can.
 * Fixture-backed destinations render only in dev mode, marked "Dev".
 */
export function NavList() {
  return (
    <nav aria-label="Main">
      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, dev }) => {
          const item = (
            <li key={href}>
              <NavLink
                href={href}
                label={label}
                icon={<Icon className="size-4 shrink-0" aria-hidden="true" />}
                badge={dev ? <DevBadge /> : null}
              />
            </li>
          );
          return dev ? <DevOnly key={href}>{item}</DevOnly> : item;
        })}
      </ul>
    </nav>
  );
}
