import { useState } from "react";
import { Menu, Home, Users, Settings } from "lucide-react";
import { motion } from "framer-motion";

export default function ResponsiveMenu() {
  const [open, setOpen] = useState(false);

  const menuItems = [
    { name: "Home", icon: <Home size={20} /> },
    { name: "Games", icon: <Users size={20} /> },
    { name: "Partners", icon: <Users size={20} /> },
    { name: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar (desktop) */}
      <motion.div
        initial={{ width: 60 }}
        animate={{ width: open ? 200 : 60 }}
        className="hidden md:flex flex-col bg-gray-800 text-white shadow-lg"
      >
        <button
          className="p-4 focus:outline-none"
          onClick={() => setOpen(!open)}
        >
          <Menu />
        </button>
        {menuItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center p-4 hover:bg-gray-700 cursor-pointer"
          >
            {item.icon}
            {open && <span className="ml-3">{item.name}</span>}
          </div>
        ))}
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between bg-white shadow px-4 py-2 md:py-4">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span>TableTalk</span>
          </div>
          <div className="hidden md:block">Hello, Craig | Logout</div>
          <button className="md:hidden" onClick={() => setOpen(!open)}>
            <Menu />
          </button>
        </div>

        {/* Page content */}
        <div className="flex-1 p-6">Page Content Here</div>

        {/* Bottom nav (mobile) */}
        <div className="md:hidden flex justify-around bg-gray-800 text-white py-3">
          {menuItems.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-sm">
              {item.icon}
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
