import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";
import logoPath from "../assets/nursing-rocks-logo.png";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-6 md:py-8 mx-auto text-center">
        {/* Logo and Tagline Section */}
        <div className="mb-4 flex flex-col md:flex-row items-center justify-center gap-4">
          <Link href="/" className="flex-shrink-0">
            <img
              src={logoPath}
              alt="Nursing Rocks!"
              className="h-14 w-auto"
            />
          </Link>
          <p className="text-sm text-muted-foreground max-w-lg text-center md:text-left">
            Nursing Rocks! Concert Series celebrates healthcare professionals with exclusive music experiences.
          </p>
        </div>

        {/* Social Media */}
        <div className="flex justify-center gap-3 mb-4">
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full p-0">
            <Instagram className="h-4 w-4" />
            <span className="sr-only">Instagram</span>
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full p-0">
            <Facebook className="h-4 w-4" />
            <span className="sr-only">Facebook</span>
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full p-0">
            <Twitter className="h-4 w-4" />
            <span className="sr-only">Twitter</span>
          </Button>
        </div>

        {/* Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 justify-items-center">
          {/* Quick Links */}
          <div className="text-center">
            <h3 className="text-base font-bold mb-2">Quick Links</h3>
            <ul className="space-y-1">
              <li>
                <Link href="/">
                  <div className="inline-block text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">Home</div>
                </Link>
              </li>
              <li>
                <Link href="/events">
                  <div className="inline-block text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">Concerts</div>
                </Link>
              </li>
              <li>
                <a href="https://nursingrocks.org" target="_blank" rel="noopener noreferrer">
                  <div className="inline-block text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">NursingRocks.org</div>
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact Us */}
          <div className="text-center">
            <h3 className="text-base font-bold mb-2">Contact Us</h3>
            <div className="space-y-1 flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  info@nursingrocks.com
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground text-center">
                  732 S 6th St, Las Vegas, NV
                </span>
              </div>
            </div>
          </div>
          
          {/* Newsletter */}
          <div className="text-center">
            <h3 className="text-base font-bold mb-2">Newsletter</h3>
            <p className="text-xs text-muted-foreground mb-2 mx-auto max-w-xs">
              Updates on upcoming concerts
            </p>
            <div className="flex items-center justify-center space-x-1 max-w-xs mx-auto">
              <Input type="email" placeholder="Email" className="h-7 text-xs max-w-32" />
              <Button type="submit" size="sm" className="h-7 text-xs">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="border-t pt-3">
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground">
              © {currentYear} Nursing Rocks! Concert Series. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/terms">
                <div className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Terms of Service
                </div>
              </Link>
              <Link href="/privacy">
                <div className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Privacy Policy
                </div>
              </Link>
              <Link href="/faq">
                <div className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  FAQ
                </div>
              </Link>
              <Link href="/admin">
                <div className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Admin
                </div>
              </Link>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Made with</span>
                <Heart className="h-3 w-3 text-primary" />
                <span className="text-xs text-muted-foreground">for Nurses</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}