import { Link, useLocation } from "@tanstack/react-router";
import { Home, CreditCard, Users, Gift, Settings } from "lucide-react";
import { useLang } from "@/lib/i18n";

export function BottomNav() {
  const { pathname } = useLocation();
  const { t } = useLang();
  const items = [
    { to: "/app", label: t("navHome"), Icon: Home },
    { to: "/cards", label: t("navCards"), Icon: CreditCard },
    { to: "/friends", label: t("navFriends"), Icon: Users },
    { to: "/invites", label: t("navInvites"), Icon: Gift },
    { to: "/settings", label: t("navSettings"), Icon: Settings },
  ] as const;
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {items.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
