import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PBNUpload from "@/components/upload/pbn-upload";
import { Upload, Menu, User } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const [showUpload, setShowUpload] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", current: location === "/" },
    { name: "Browse Games", href: "/browse", current: location === "/browse" },
    { name: "Practice", href: "/practice", current: location === "/practice" },
    { name: "Statistics", href: "/stats", current: location === "/stats" },
  ];

  return (
    <>
      <header className="bg-white material-shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-bridge text-white text-lg" />
                </div>
                <h1 className="text-xl font-bold text-text-primary">TableTalk</h1>
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      item.current
                        ? "text-primary font-medium border-b-2 border-primary"
                        : "text-text-secondary hover:text-primary transition-colors"
                    } pb-4`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowUpload(true)} className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Upload PBN</span>
              </Button>
              
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gray-300">
                  <User className="h-4 w-4 text-gray-600" />
                </AvatarFallback>
              </Avatar>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="mt-6 space-y-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`block ${
                          item.current
                            ? "text-primary font-medium"
                            : "text-text-secondary hover:text-primary transition-colors"
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <PBNUpload open={showUpload} onOpenChange={setShowUpload} />
    </>
  );
}
