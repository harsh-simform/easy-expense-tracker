"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, AlertCircle, TrendingUp, BellRing, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SpendingAlert as SpendingAlertData } from "@/lib/spending-alert";

const STORAGE_KEY = "spending-alert:last-notified";

const styles: Record<
  SpendingAlertData["severity"],
  { wrap: string; icon: typeof AlertTriangle; iconClass: string; badge: string }
> = {
  ok: {
    wrap: "ring-emerald-500/30 bg-emerald-500/5",
    icon: TrendingUp,
    iconClass: "text-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  watch: {
    wrap: "ring-amber-500/30 bg-amber-500/5",
    icon: AlertTriangle,
    iconClass: "text-amber-500",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  warning: {
    wrap: "ring-orange-500/40 bg-orange-500/5",
    icon: AlertTriangle,
    iconClass: "text-orange-500",
    badge: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  },
  critical: {
    wrap: "ring-red-500/50 bg-red-500/10",
    icon: AlertCircle,
    iconClass: "text-red-500",
    badge: "bg-red-500/15 text-red-700 dark:text-red-400",
  },
};

const severityLabel: Record<SpendingAlertData["severity"], string> = {
  ok: "On track",
  watch: "Watch",
  warning: "Warning",
  critical: "Critical",
};

export function SpendingAlert({ alert }: { alert: SpendingAlertData }) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!alert.enabled) return;
    if (alert.severity === "ok") return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const today = new Date().toISOString().slice(0, 10);
    const last = window.localStorage.getItem(STORAGE_KEY);
    if (last === today) return;

    try {
      new Notification(alert.headline, {
        body: alert.actions[0] ?? alert.message,
        tag: `spending-alert-${today}`,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
      });
      window.localStorage.setItem(STORAGE_KEY, today);
    } catch {
      // ignore
    }
  }, [alert]);

  if (!alert.enabled) return null;
  if (alert.severity === "ok") return null;

  const s = styles[alert.severity];
  const Icon = s.icon;

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  return (
    <Card className={cn("ring-1", s.wrap)}>
      <CardContent className="space-y-3 px-4">
        <div className="flex items-start gap-3">
          <Icon className={cn("mt-0.5 size-5 shrink-0", s.iconClass)} />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold leading-tight">{alert.headline}</h3>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  s.badge,
                )}
              >
                {severityLabel[alert.severity]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{alert.message}</p>
          </div>
        </div>

        {alert.actions.length > 0 && (
          <div className="space-y-1.5 rounded-md border border-foreground/10 bg-background/60 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Action plan
            </div>
            <ul className="space-y-1 text-sm">
              {alert.actions.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {permission === "default" && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-foreground/10 bg-background/60 p-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Bell className="size-4" />
              <span>Get a daily heads-up when you're overspending.</span>
            </div>
            <Button size="sm" variant="outline" onClick={requestPermission}>
              <BellRing className="size-4" />
              Enable
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
