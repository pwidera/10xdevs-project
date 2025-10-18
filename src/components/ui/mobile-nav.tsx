import { useState } from "react";
import { Menu, Home, Sparkles, BookOpen } from "lucide-react";
import { Button } from "./button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";

interface MobileNavProps {
  /**
   * Whether the user is authenticated
   */
  isAuthenticated: boolean;
}

/**
 * Mobile navigation menu (burger menu) for authenticated users
 * Provides navigation to: Home, Generate, Flashcards
 */
export function MobileNav({ isAuthenticated }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  const handleNavigate = (href: string) => {
    setOpen(false);
    window.location.href = href;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Otwórz menu nawigacji">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Otwórz menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 mt-6" aria-label="Nawigacja główna">
          <button
            onClick={() => handleNavigate("/")}
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left"
          >
            <Home className="h-5 w-5" />
            <span className="font-medium">Strona główna</span>
          </button>
          <button
            onClick={() => handleNavigate("/app/generate")}
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left"
          >
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Generator AI</span>
          </button>
          <button
            onClick={() => handleNavigate("/app/flashcards")}
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left"
          >
            <BookOpen className="h-5 w-5" />
            <span className="font-medium">Moje fiszki</span>
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
