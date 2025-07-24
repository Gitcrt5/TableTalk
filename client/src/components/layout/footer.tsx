export default function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>© 2025 TableTalk</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Bridge Review Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="mailto:admin@tabletalk.cards" 
              className="hover:text-foreground transition-colors"
            >
              Contact: admin@tabletalk.cards
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}