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
import { Menu, X, User, HeartPulse, Map, ShoppingBag, Image, PlayCircle } from "lucide-react";
import newLogoPath from "../assets/NursingRocks_NewLogo.png";
import { useIsMobile } from "@/hooks/use-mobile";

// Define the type for navigation links
interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  isExternal?: boolean;
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const isMobile = useIsMobile();
  const [location] = useLocation();
  // Cart functionality removed as store is non-functioning

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

  // Navigation links - some links are only for authenticated users
  const publicNavLinks: NavLink[] = [
    { href: "/", label: "Home", icon: <HeartPulse size={18} /> },
    { href: "/videos", label: "Videos", icon: <PlayCircle size={18} /> },
    { href: "/sponsors", label: "Sponsors", icon: <HeartPulse size={18} /> },
    { href: "https://rgwrvu-sq.myshopify.com/", label: "Store", icon: <ShoppingBag size={18} />, isExternal: true },
  ];
  
  const authenticatedNavLinks: NavLink[] = [
    { href: "/gallery", label: "Gallery", icon: <Image size={18} /> },
  ];
  
  // Combine links based on authentication status
  const navLinks: NavLink[] = [
    ...publicNavLinks,
    ...(isLoggedIn ? authenticatedNavLinks : []),
  ];

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
      <div className="w-full h-1.5 nurse-gradient"></div>
      
      <div className="page-container">
        <div className="flex items-center justify-between h-20">
          {/* Logo on left */}
          <div className="flex-shrink-0">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <img
                  src={newLogoPath}
                  alt="Nursing Rocks!"
                  className="h-12 md:h-14 w-auto"
                />
                <span className="heartbeat-animation text-lg font-semibold hidden lg:inline-block">
                  Concert Series
                </span>
              </div>
            </Link>
          </div>
          
          {/* Navigation in center - centered and justified content */}
          {!isMobile ? (
            <nav className="flex items-center justify-center md:ml-4 lg:ml-8 flex-grow">
              <div className="flex items-center justify-start flex-wrap gap-x-3 md:gap-x-4 lg:gap-x-6">
                {navLinks.map((link) => (
                  link.isExternal ? (
                    <a 
                      key={link.href} 
                      href={link.href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`text-xs md:text-sm font-medium cursor-pointer flex items-center gap-1 transition-colors hover:text-primary text-muted-foreground py-1`}
                    >
                      {link.icon}
                      <span className="hidden md:inline">{link.label}</span>
                    </a>
                  ) : (
                    <Link key={link.href} href={link.href}>
                      <div
                        className={`text-xs md:text-sm font-medium cursor-pointer flex items-center gap-1 transition-colors hover:text-primary py-1 ${
                          isActive(link.href) ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {link.icon}
                        <span className="hidden md:inline">{link.label}</span>
                      </div>
                    </Link>
                  )
                ))}
              </div>
            </nav>
          ) : (
            <div className="flex-grow"></div>
          )}
          
          {/* Right side controls - always visible */}
          <div className="flex items-center space-x-3">
            
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 rounded-full">
                    <User size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">My Dashboard</Link>
                  </DropdownMenuItem>
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
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" asChild size="sm">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}
            
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="sm:ml-2"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobile && isMenuOpen && (
        <div className="page-container py-4 border-t bg-background shadow-md">
          <nav className="flex flex-col max-w-sm mx-auto space-y-3">
            {/* Header in mobile menu */}
            <div className="text-center mb-2 pb-2 border-b">
              <h3 className="font-medium text-lg">Menu</h3>
            </div>
            
            {/* Navigation links */}
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                link.isExternal ? (
                  <a 
                    key={link.href} 
                    href={link.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 rounded-md transition-colors text-muted-foreground hover:bg-muted"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.icon}
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.href} href={link.href}>
                    <div 
                      className={`flex items-center justify-center gap-2 p-3 rounded-md transition-colors ${
                        isActive(link.href) 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.icon}
                      {link.label}
                    </div>
                  </Link>
                )
              ))}
            </div>
            
            {/* Cart link removed as store is non-functioning */}
            
            {/* Account related links */}
            <div className="border-t pt-3 mt-2">
              {isLoggedIn ? (
                <div className="space-y-2">
                  <Link href="/dashboard">
                    <div
                      className="flex items-center justify-center gap-2 p-3 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User size={18} />
                      My Dashboard
                    </div>
                  </Link>
                  <Link href="/profile">
                    <div
                      className="flex items-center justify-center gap-2 p-3 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User size={18} />
                      My Profile
                    </div>
                  </Link>
                  <div
                    className="flex items-center justify-center gap-2 p-3 rounded-md text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => {
                      setIsMenuOpen(false);
                      window.location.href = "/license-verification";
                    }}
                  >
                    <HeartPulse size={18} />
                    License Verification
                  </div>
                  <Link href="/tickets">
                    <div
                      className="flex items-center justify-center gap-2 p-3 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User size={18} />
                      My Tickets
                    </div>
                  </Link>
                  <div
                    className="flex items-center justify-center gap-2 p-3 rounded-md text-primary/80 hover:bg-primary/10 transition-colors cursor-pointer"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                  >
                    Logout
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 p-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login">
                      <div 
                        className="flex items-center justify-center"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Login
                      </div>
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register">
                      <div 
                        className="flex items-center justify-center"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Register
                      </div>
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}