import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Menu, X, User, HeartPulse, Map, ShoppingBag, ShoppingCart } from "lucide-react";
import newLogoPath from "../assets/NursingRocks_NewLogo.png";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCart } from "@/hooks/use-cart";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const { totalItems } = useCart();

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

  const navLinks = [
    { href: "/", label: "Home", icon: <HeartPulse size={18} /> },
    { href: "/cities", label: "Concert Cities", icon: <Map size={18} /> },
    { href: "/sponsors", label: "Sponsors", icon: <HeartPulse size={18} /> },
    { href: "/store", label: "Store", icon: <ShoppingBag size={18} /> },
  ];

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="w-full h-1.5 nurse-gradient"></div>
      
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-20">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img
                src={newLogoPath}
                alt="Nursing Rocks!"
                className="h-14 md:h-16 w-auto"
              />
              <span className="heartbeat-animation text-lg font-semibold">
                Concert Series
              </span>
            </div>
          </Link>
          
          {!isMobile ? (
            <nav className="flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <div
                    className={`text-sm font-medium cursor-pointer flex items-center gap-2 ${
                      isActive(link.href) ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </div>
                </Link>
              ))}
              
              <Link href="/cart">
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <ShoppingCart size={18} />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {totalItems > 99 ? '99+' : totalItems}
                    </Badge>
                  )}
                </Button>
              </Link>
              
              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 w-9 rounded-full">
                      <User size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">My Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = "/license-verification"}>
                      License Verification
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/tickets">My Tickets</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" asChild size="sm">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">Register</Link>
                  </Button>
                </div>
              )}
            </nav>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          )}
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobile && isMenuOpen && (
        <div className="container py-4 border-t">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div 
                  className={`flex items-center gap-2 p-2 rounded-md ${
                    isActive(link.href) ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.icon}
                  {link.label}
                </div>
              </Link>
            ))}
            
            <Link href="/cart">
              <div
                className="flex items-center gap-2 p-2 rounded-md text-muted-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart size={18} />
                Shopping Cart
                {totalItems > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {totalItems}
                  </Badge>
                )}
              </div>
            </Link>
            
            {isLoggedIn ? (
              <>
                <Link href="/profile">
                  <div
                    className="flex items-center gap-2 p-2 rounded-md text-muted-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={18} />
                    My Profile
                  </div>
                </Link>
                <div
                  className="flex items-center gap-2 p-2 rounded-md text-muted-foreground cursor-pointer"
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.location.href = "/license-verification";
                  }}
                >
                  License Verification
                </div>
                <Link href="/tickets">
                  <div
                    className="flex items-center gap-2 p-2 rounded-md text-muted-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Tickets
                  </div>
                </Link>
                <div
                  className="flex items-center gap-2 p-2 rounded-md text-muted-foreground cursor-pointer"
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  Logout
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-2 p-2">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/login">
                    <div onClick={() => setIsMenuOpen(false)}>
                      Login
                    </div>
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/register">
                    <div onClick={() => setIsMenuOpen(false)}>
                      Register
                    </div>
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