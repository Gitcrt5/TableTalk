import { Link } from "wouter";
import logoUrl from "@/assets/tabletalk-logo.svg";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src={logoUrl} 
              alt="TableTalk Logo" 
              className="w-10 h-10"
            />
            <h1 className="text-xl font-bold text-text-primary">TableTalk</h1>
          </Link>
        </div>
      </div>
    </header>
  );
}
