import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Home,
  Gamepad2,
  Calendar,
  Users,
  Compass,
  Shield
} from "lucide-react";
import logo from "@/assets/tabletalk-logo.svg";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "My Games",
    url: "/my-games",
    icon: Gamepad2,
  },
  {
    title: "Events",
    url: "/events",
    icon: Calendar,
  },
  {
    title: "Partnerships",
    url: "/partnerships",
    icon: Users,
  },
  {
    title: "Discover",
    url: "/explore",
    icon: Compass,
  },
  {
    title: "Admin",
    url: "/admin",
    icon: Shield,
  },
];

export const AppSidebar = () => {
  const { user } = useAuth();
  const [location] = useLocation();

  // Don't render sidebar if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <Sidebar side="left" variant="inset">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/">
          <div className="flex items-center gap-3 px-2 py-2 cursor-pointer" data-testid="link-home">
            <img
              src={logo}
              alt="TableTalk Logo"
              className="w-8 h-8"
            />
            <div>
              <h1 className="text-base font-bold text-sidebar-foreground">TableTalk</h1>
              <p className="text-xs text-sidebar-foreground/70">Bridge Analysis Platform</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={location === item.url}
                data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
              >
                <Link href={item.url}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};