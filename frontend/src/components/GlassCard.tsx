import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

const GlassCard = ({ children, className = "", hover = false, onClick }: GlassCardProps) => (
  <div
    onClick={onClick}
    className={cn(
      "glass rounded-xl p-6",
      hover && "hover-lift cursor-pointer",
      onClick && "cursor-pointer",
      className
    )}
  >
    {children}
  </div>
);

export default GlassCard;
