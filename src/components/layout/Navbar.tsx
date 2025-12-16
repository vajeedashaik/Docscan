import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { dark, light } from '@clerk/themes';
import { cn } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const logoSrc = theme === 'dark' 
    ? '/dark_theme-removebg-preview.png'
    : '/light_theme-removebg-preview.png';

  const navLinks = [
    { href: '/ocr', label: 'OCR Scanner' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/settings', label: 'Settings' },
    { href: '/pricing', label: 'Pricing' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b border-border/40 bg-card/50 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
            <div className="relative">
              <img 
                src={logoSrc} 
                alt="DocScan AI" 
                className="h-14 w-auto"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-smooth',
                  isActive(link.href)
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Auth */}
            <div className="hidden sm:flex items-center gap-2">
              <SignedOut>
                <SignInButton mode="modal" appearance={{ baseTheme: theme === 'dark' ? dark : light }}>
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton 
                  appearance={{ 
                    baseTheme: theme === 'dark' ? dark : light,
                    elements: {
                      userButtonBox: "transition-smooth",
                      userButtonTrigger: "focus:shadow-none"
                    }
                  }} 
                  userProfileMode="modal"
                />
              </SignedIn>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-border/40 py-4 space-y-2 animate-slide-down">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-4 py-2 rounded-lg text-sm font-semibold transition-smooth',
                  isActive(link.href)
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 py-2">
              <SignedOut>
                <SignInButton mode="modal" appearance={{ baseTheme: theme === 'dark' ? dark : light }}>
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton 
                  appearance={{ 
                    baseTheme: theme === 'dark' ? dark : light,
                    elements: {
                      userButtonBox: "transition-smooth",
                      userButtonTrigger: "focus:shadow-none"
                    }
                  }}
                  userProfileMode="modal"
                />
              </SignedIn>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
