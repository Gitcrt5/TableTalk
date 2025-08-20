import { SuitSymbol } from "@/components/bridge/SuitSymbol";

export const AppFooter = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-bridge-green flex items-center justify-center">
                <div className="text-white text-sm font-bold">TT</div>
              </div>
              <span className="font-bold text-gray-900">TableTalk</span>
            </div>
            <p className="text-sm text-gray-600">
              The bridge analysis platform for players of all levels. Learn, analyze, and improve your game.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Features</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-bridge-green transition-colors">Game Analysis</a></li>
              <li><a href="#" className="hover:text-bridge-green transition-colors">Event Management</a></li>
              <li><a href="#" className="hover:text-bridge-green transition-colors">Partnership Tools</a></li>
              <li><a href="#" className="hover:text-bridge-green transition-colors">Discussion Forums</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-bridge-green transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-bridge-green transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-bridge-green transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-bridge-green transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Community</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-bridge-green transition-colors">Bridge Clubs</a></li>
              <li><a href="#" className="hover:text-bridge-green transition-colors">Player Directory</a></li>
              <li><a href="#" className="hover:text-bridge-green transition-colors">Learning Resources</a></li>
              <li><a href="#" className="hover:text-bridge-green transition-colors">Blog</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-6 pt-6 text-center text-sm text-gray-600">
          © 2025 TableTalk. All rights reserved. Built for the bridge community.
        </div>
      </div>
    </footer>
  );
};
