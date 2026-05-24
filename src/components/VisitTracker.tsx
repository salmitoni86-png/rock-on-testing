import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackVisit } from "@/lib/visit-tracker";

export function VisitTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    trackVisit(pathname);
  }, [pathname]);
  return null;
}
