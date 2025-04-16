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
    { href: "/artists", label: "Artists" },
    { href: "/venues", label: "Venues" },
  ];

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <a className="flex items-center gap-2">
              <img
                src={logoPath}
                alt="Nursing Rocks!"
                className="h-12 md:h-14 w-auto"
              />
            </a>
          </Link>
        </div>
        
        {!isMobile ? (
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.href)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </a>
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
                      <a className="w-full cursor-pointer">My Profile</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/license">
                      <a className="w-full cursor-pointer">License Verification</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/tickets">
                      <a className="w-full cursor-pointer">My Tickets</a>
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
                    <a>Login</a>
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/register">
                    <a>Register</a>
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
                <a
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.href)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              </Link>
            ))}
            
            {isLoggedIn ? (
              <>
                <Link href="/profile">
                  <a
                    className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </a>
                </Link>
                <Link href="/license">
                  <a
                    className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    License Verification
                  </a>
                </Link>
                <Link href="/tickets">
                  <a
                    className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Tickets
                  </a>
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
                    <a onClick={() => setIsMenuOpen(false)}>Login</a>
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/register">
                    <a onClick={() => setIsMenuOpen(false)}>Register</a>
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