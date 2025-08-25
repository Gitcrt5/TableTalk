
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerticalIconBarProps {
  className?: string;
}

export const VerticalIconBar = ({ className }: VerticalIconBarProps) => {
  return (
    <div className={cn(
      "fixed left-0 top-16 z-40 flex flex-col bg-background border-r border-border shadow-sm",
      "w-12 h-[calc(100vh-4rem)]",
      "hidden md:flex", // Only show on desktop
      className
    )}>
      <div className="flex flex-col items-center py-2 space-y-1">
        <SidebarTrigger className="w-8 h-8 hover:bg-accent hover:text-accent-foreground" />
      </div>
    </div>
  );
};
