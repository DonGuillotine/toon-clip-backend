import { DevBadge, DevOnly } from "@/features/dev-mode/components/dev-mode";

import { NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav";
import { NavMore } from "./nav-more";

/**
 * Server component. Icons are rendered here and passed down as elements:
 * a component (a function) cannot cross into a client component, an element can.
 * Fixture-backed destinations render only in dev mode, marked "Dev". In the
 * top bar they fold into one "More" menu so the bar stays one line.
 */
export function NavList({ layout }: { readonly layout: "bar" | "drawer" }) {
  if (layout === "bar") {
    const devItems = NAV_ITEMS.filter((item) => item.dev).map(({ href, label }) => ({
      href,
      label,
    }));
    return (
      <nav aria-label="Main">
        <ul className="flex items-center gap-7">
          {NAV_ITEMS.filter((item) => !item.dev).map(({ href, label }) => (
            <li key={href}>
              <NavLink href={href} label={label} icon={null} badge={null} layout="bar" />
            </li>
          ))}
          <DevOnly>
            <li>
              <NavMore items={devItems} />
            </li>
          </DevOnly>
        </ul>
      </nav>
    );
  }
  return (
    <nav aria-label="Main">
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, dev }) => {
          const item = (
            <li key={href}>
              <NavLink
                href={href}
                label={label}
                icon={<Icon className="size-4 shrink-0" aria-hidden="true" />}
                badge={dev ? <DevBadge /> : null}
                layout={layout}
              />
            </li>
          );
          return dev ? <DevOnly key={href}>{item}</DevOnly> : item;
        })}
      </ul>
    </nav>
  );
}
