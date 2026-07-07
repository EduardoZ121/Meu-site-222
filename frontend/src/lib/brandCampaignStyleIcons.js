import React from "react";
import {
  Car,
  Cpu,
  Dumbbell,
  Gem,
  Globe,
  Home,
  Package,
  Shirt,
  Shuffle,
  Sparkles,
  Users,
  UtensilsCrossed,
  Wine,
} from "lucide-react";

export const BRAND_STYLE_ICON_MAP = {
  shirt: Shirt,
  car: Car,
  sparkles: Sparkles,
  utensils: UtensilsCrossed,
  wine: Wine,
  globe: Globe,
  users: Users,
  cpu: Cpu,
  gem: Gem,
  home: Home,
  dumbbell: Dumbbell,
  package: Package,
  shuffle: Shuffle,
};

export function BrandStyleIcon({ name, className = "w-4 h-4" }) {
  const Icon = BRAND_STYLE_ICON_MAP[name] || Package;
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}
