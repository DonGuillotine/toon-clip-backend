import { NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav";

/**
 * Server component. Icons are rendered here and passed down as elements:
 * a component (a function) cannot cross into a client component, an element can.
 */
export function NavList() {
  return (
    <nav aria-label="Main">
      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, soon }) => (
          <li key={href}>
            <NavLink
              href={href}
              label={label}
              soon={soon === true}
              icon={<Icon className="size-4 shrink-0" aria-hidden="true" />}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
