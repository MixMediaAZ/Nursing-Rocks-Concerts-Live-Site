import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";
import logoPath from "../assets/nursing-rocks-logo.png";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="page-container content-wrapper py-6 md:py-10 mx-auto">
        {/* Logo and Tagline Section */}
        <div className="mb-8 flex flex-col md:flex-row items-center justify-center gap-4">
          <Link href="/" className="flex-shrink-0">
            <img
              src={logoPath}
              alt="Nursing Rocks!"
              className="h-14 md:h-16 w-auto"
            />
          </Link>
          <p className="text-sm text-muted-foreground max-w-lg text-center">
            Nursing Rocks! Concert Series celebrates healthcare professionals with exclusive music experiences.
          </p>
        </div>

        {/* Social Media */}
        <div className="flex justify-center gap-4 mb-8">
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full p-0 transition-all hover:bg-primary/10">
            <Instagram className="h-5 w-5" />
            <span className="sr-only">Instagram</span>
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full p-0 transition-all hover:bg-primary/10">
            <Facebook className="h-5 w-5" />
            <span className="sr-only">Facebook</span>
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full p-0 transition-all hover:bg-primary/10">
            <Twitter className="h-5 w-5" />
            <span className="sr-only">Twitter</span>
          </Button>
        </div>

        {/* Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 mx-auto max-w-4xl">
          {/* Quick Links */}
          <div className="text-center">
            <h3 className="text-base font-bold mb-3">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <div className="inline-block text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">Home</div>
                </Link>
              </li>
              <li>
                <Link href="/events">
                  <div className="inline-block text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">Concerts</div>
                </Link>
              </li>
              <li>
                <a href="https://nursingrocks.org" target="_blank" rel="noopener noreferrer">
                  <div className="inline-block text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">NursingRocks.org</div>
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact Us */}
          <div className="text-center">
            <h3 className="text-base font-bold mb-3">Contact Us</h3>
            <div className="space-y-2 flex flex-col items-center">
              <a href="mailto:info@nursingrocks.com" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
                <span className="text-sm">
                  info@nursingrocks.com
                </span>
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground text-center">
                  732 S 6th St, Las Vegas, NV
                </span>
              </div>
            </div>
          </div>
          
          {/* Newsletter */}
          <div className="text-center">
            <h3 className="text-base font-bold mb-3">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-3 mx-auto">
              Updates on upcoming concerts
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2 max-w-xs mx-auto">
              <Input type="email" placeholder="Email" className="h-9 text-sm" />
              <Button type="submit" size="sm" className="h-9 text-sm w-full sm:w-auto">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="border-t pt-6">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Nursing Rocks! Concert Series. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              <Link href="/terms">
                <div className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Terms of Service
                </div>
              </Link>
              <Link href="/privacy">
                <div className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Privacy Policy
                </div>
              </Link>
              <Link href="/faq">
                <div className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  FAQ
                </div>
              </Link>
              <Link href="/admin">
                <div className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Admin
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-sm text-muted-foreground">Made with</span>
              <Heart className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">for Nurses</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}