import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

const Header = () => {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Search for:", searchQuery);
  };

  const navLinks = [
    { name: "Events", href: "#events" },
    { name: "Venues", href: "#venues" },
    { name: "Artists", href: "#artists" },
    { name: "Gallery", href: "#gallery" },
  ];

  return (
    <header className="bg-[#333333] text-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-heading font-bold flex items-center">
              <span className="text-[#FF3366]">Sound</span>
              <span className="text-[#00A3E0]">Stage</span>
              <i className="fas fa-music ml-2 text-white"></i>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a 
                key={link.name}
                href={link.href}
                className="hover:text-[#FF3366] transition-colors"
              >
                {link.name}
              </a>
            ))}
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search events..."
                className="py-1 px-3 rounded-full text-[#333333] text-sm w-40 h-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit"
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-[#333333] h-6 w-6"
              >
                <Search className="h-3 w-3" />
              </Button>
            </form>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white" 
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav
          className={cn(
            "md:hidden py-4 border-t border-gray-700",
            isMobileMenuOpen ? "block" : "hidden"
          )}
        >
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <a 
                key={link.name}
                href={link.href}
                className="hover:text-[#FF3366] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <form onSubmit={handleSearch} className="relative mt-2">
              <Input
                type="text"
                placeholder="Search events..."
                className="py-1 px-3 rounded-full text-[#333333] text-sm w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit"
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-[#333333] h-6 w-6"
              >
                <Search className="h-3 w-3" />
              </Button>
            </form>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
