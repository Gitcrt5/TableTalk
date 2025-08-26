import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Home, Gamepad2, Calendar, Users, Compass, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
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

export const ResponsiveNavigation = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const [location] = useLocation();

  // Don't render navigation if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Sidebar (desktop) */}
      <motion.div
        initial={{ width: 60 }}
        animate={{ width: open ? 200 : 60 }}
        className="hidden md:flex flex-col bg-slate-900 text-white shadow-lg"
      >
        <div className="p-4 border-b border-slate-700">
          <button
            className="flex items-center justify-center w-full focus:outline-none"
            onClick={() => setOpen(!open)}
            data-testid="button-menu-toggle"
          >
            <Menu size={20} />
          </button>
        </div>
        
        <div className="flex-1 py-2">
          {navigationItems.map((item) => {
            const isActive = location === item.url;
            return (
              <Link key={item.title} href={item.url}>
                <div
                  className={`flex items-center p-4 hover:bg-slate-700 cursor-pointer transition-colors ${
                    isActive ? 'bg-slate-700 border-r-2 border-bridge-green' : ''
                  }`}
                  data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon size={20} />
                  {open && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-3 whitespace-nowrap"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 border-t border-slate-700"
          >
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="TableTalk Logo"
                className="w-6 h-6"
              />
              <div className="text-xs">
                <div className="font-medium">TableTalk</div>
                <div className="text-slate-400">Bridge Platform</div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Bottom nav (mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around bg-slate-900 text-white py-3 border-t border-slate-700">
        {navigationItems.slice(0, 5).map((item) => {
          const isActive = location === item.url;
          return (
            <Link key={item.title} href={item.url}>
              <div 
                className={`flex flex-col items-center text-xs transition-colors ${
                  isActive ? 'text-bridge-green' : 'text-white hover:text-slate-300'
                }`}
                data-testid={`nav-mobile-${item.title.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon size={20} />
                <span className="mt-1">{item.title}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
};