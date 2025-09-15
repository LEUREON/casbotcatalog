import React from "react";
import type { LucideIcon } from "lucide-react";

export const ICON_STROKE = { idle: 1.9, active: 2.2 } as const;
export const ICON_SIZE = { dock: "1.25em", row: "1.20em", dockLg: "1.35em", avatar: "1.60em" } as const;

type IconBaseProps = {
  icon: LucideIcon;
  active?: boolean;
  size?: keyof typeof ICON_SIZE;
  className?: string;
  style?: React.CSSProperties;
};

export default function IconBase({ icon: Icon, active = false, size = "dock", className, style }: IconBaseProps) {
  return (
    <Icon
      className={className}
      style={{ width: ICON_SIZE[size], height: ICON_SIZE[size], ...style }}
      strokeWidth={active ? ICON_STROKE.active : ICON_STROKE.idle}
      vectorEffect="non-scaling-stroke"
      shapeRendering="geometricPrecision"
     preserveAspectRatio="xMidYMid meet" />
  );
}
