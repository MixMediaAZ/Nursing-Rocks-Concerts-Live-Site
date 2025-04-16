import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User } from "lucide-react";
import logoPath from "../assets/nursing-rocks-logo.png";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const isMobile = useIsMobile();
  const [location] = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      setIsLoggedIn(true);
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    window.location.href = "/";
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/events", label: "Concerts" },
    { href: "/cities", label: "Concert Cities" },
    { href: "/artists", label: "Artists" },
    { href: "/venues", label: "Venues" },
    { href: "/sponsors", label: "Sponsors" },
  ];

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img
                src={logoPath}
                alt="Nursing Rocks!"
                className="h-12 md:h-14 w-auto"
              />
            </div>
          </Link>
        </div>
        
        {!isMobile ? (
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div
                  className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                    isActive(link.href)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </div>
              </Link>
            ))}
            
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <div className="w-full cursor-pointer">My Profile</div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/license">
                      <div className="w-full cursor-pointer">License Verification</div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/tickets">
                      <div className="w-full cursor-pointer">My Tickets</div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <div className="w-full cursor-pointer">Admin Dashboard</div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">
                    <div className="cursor-pointer">Login</div>
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/register">
                    <div className="cursor-pointer">Register</div>
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        ) : (
          <Button
            variant="ghost"
            className="p-0 h-10 w-10 rounded-full"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        )}
      </div>
      
      {/* Mobile Menu */}
      {isMobile && isMenuOpen && (
        <div className="container py-4 bg-background border-t">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div
                  className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                    isActive(link.href)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </div>
              </Link>
            ))}
            
            {isLoggedIn ? (
              <>
                <Link href="/profile">
                  <div
                    className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground cursor-pointer"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </div>
                </Link>
                <Link href="/license">
                  <div
                    className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground cursor-pointer"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    License Verification
                  </div>
                </Link>
                <Link href="/tickets">
                  <div
                    className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground cursor-pointer"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Tickets
                  </div>
                </Link>
                <Link href="/admin">
                  <div
                    className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground cursor-pointer"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Dashboard
                  </div>
                </Link>
                <a
                  className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground cursor-pointer"
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  Logout
                </a>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/login">
                    <div className="cursor-pointer" onClick={() => setIsMenuOpen(false)}>Login</div>
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/register">
                    <div className="cursor-pointer" onClick={() => setIsMenuOpen(false)}>Register</div>
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}