import {
  Utensils,
  Fuel,
  ShoppingCart,
  ShoppingBag,
  Receipt,
  Home,
  HeartPulse,
  Tv,
  Plane,
  Circle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  utensils: Utensils,
  fuel: Fuel,
  "shopping-cart": ShoppingCart,
  "shopping-bag": ShoppingBag,
  receipt: Receipt,
  home: Home,
  "heart-pulse": HeartPulse,
  tv: Tv,
  plane: Plane,
  circle: Circle,
};

export function CategoryIcon({
  icon,
  color,
  className,
}: {
  icon: string | null | undefined;
  color: string | null | undefined;
  className?: string;
}) {
  const Icon = iconMap[icon ?? "circle"] ?? Circle;
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        className,
      )}
      style={{
        backgroundColor: color ? `${color}22` : undefined,
        color: color ?? undefined,
      }}
    >
      <Icon className="size-4" />
    </span>
  );
}
