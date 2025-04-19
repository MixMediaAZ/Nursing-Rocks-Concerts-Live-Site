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
import { 
  Menu, 
  X, 
  User, 
  Stethoscope, 
  Music, 
  Map, 
  Users, 
  Building2, 
  HeartPulse, 
  Briefcase, 
  ShoppingBag, 
  ShoppingCart 
} from "lucide-react";
import logoPath from "../assets/nursing-rocks-logo.png";
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { href: "/", label: "Home", icon: <HeartPulse className="h-4 w-4" /> },
    { href: "/events", label: "Concerts", icon: <Music className="h-4 w-4" /> },
    { href: "/cities", label: "Concert Cities", icon: <Map className="h-4 w-4" /> },
    { href: "/artists", label: "Artists", icon: <Users className="h-4 w-4" /> },
    { href: "/venues", label: "Venues", icon: <Building2 className="h-4 w-4" /> },
    { href: "/license", label: "License Verification", icon: <Stethoscope className="h-4 w-4" /> },
    { href: "/sponsors", label: "Sponsors", icon: <HeartPulse className="h-4 w-4" /> },
    { href: "/jobs", label: "Jobs Board", icon: <Briefcase className="h-4 w-4" /> },
    { href: "/nursing-jobs", label: "Nursing Jobs", icon: <Stethoscope className="h-4 w-4" /> },
    { href: "/store", label: "Store", icon: <ShoppingBag className="h-4 w-4" /> },
  ];

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Medical-themed top strip */}
      <div className="w-full h-1.5 nurse-gradient"></div>
      
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img
                src={newLogoPath}
                alt="Nursing Rocks!"
                className="h-12 md:h-14 w-auto drop-shadow-sm"
              />
              <div className="hidden md:block">
                <span className="heartbeat-animation text-sm font-medium text-primary">
                  Concert Series
                </span>
              </div>
            </div>
          </Link>
        </div>
        
        {!isMobile ? (
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div
                  className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer flex items-center gap-1.5 ${
                    isActive(link.href)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </div>
              </Link>
            ))}
            
            {/* Shopping Cart */}
            <Link href="/cart">
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <ShoppingCart className="h-5 w-5" />
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
        <div className="container py-4 bg-background border-t border-primary/10">
          <div className="bg-primary/5 rounded-md p-4">
            <div className="flex items-center mb-3">
              <span className="p-1.5 bg-primary text-white rounded-full mr-2">
                <Stethoscope className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-medium text-primary">Navigation</span>
            </div>
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <div
                    className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded-md ${
                      isActive(link.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.icon}
                    {link.label}
                  </div>
                </Link>
              ))}
              
              {/* Cart link in mobile menu */}
              <Link href="/cart">
                <div
                  className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingCart className="h-4 w-4" />
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
                      className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </div>
                  </Link>
                  <Link href="/license">
                    <div
                      className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Stethoscope className="h-4 w-4" />
                      License Verification
                    </div>
                  </Link>
                  <Link href="/tickets">
                    <div
                      className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      My Tickets
                    </div>
                  </Link>
                  <Link href="/admin">
                    <div
                      className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      Admin Dashboard
                    </div>
                  </Link>
                  <div
                    className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded-md"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </div>
                </>
              ) : (
                <div className="pt-4 mt-4 border-t border-primary/10">
                  <Button variant="outline" asChild className="w-full mb-2 rounded-full">
                    <Link href="/login">
                      <div className="cursor-pointer flex items-center justify-center gap-2" onClick={() => setIsMenuOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Login
                      </div>
                    </Link>
                  </Button>
                  <Button asChild className="w-full rounded-full">
                    <Link href="/register">
                      <div className="cursor-pointer flex items-center justify-center gap-2" onClick={() => setIsMenuOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Register
                      </div>
                    </Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}