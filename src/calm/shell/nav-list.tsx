import { CALM_NAV_ITEMS } from "./nav-items";
import { CalmNavLink } from "./nav";

export function CalmNavList() {
  return (
    <nav aria-label="Main">
      <ul className="flex flex-col gap-0.5">
        {CALM_NAV_ITEMS.map(({ href, label, icon: Icon, soon }) => (
          <li key={href}>
            <CalmNavLink
              href={href}
              label={label}
              soon={soon === true}
              icon={<Icon className="size-4 shrink-0" aria-hidden="true" strokeWidth={2} />}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
