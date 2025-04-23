import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";
import logoPath from "../assets/nursing-rocks-logo.png";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-12 md:py-16 mx-auto text-center">
        {/* Logo and Tagline Section */}
        <div className="mb-10 flex flex-col md:flex-row items-center justify-center gap-6">
          <Link href="/" className="flex-shrink-0">
            <img
              src={logoPath}
              alt="Nursing Rocks!"
              className="h-20 w-auto"
            />
          </Link>
          <p className="text-base text-muted-foreground max-w-lg text-center md:text-left">
            Nursing Rocks! Concert Series celebrates healthcare professionals with exclusive music experiences.
          </p>
        </div>

        {/* Social Media */}
        <div className="flex justify-center gap-4 mb-8">
          <Button size="icon" variant="ghost" className="rounded-full">
            <Instagram className="h-5 w-5" />
            <span className="sr-only">Instagram</span>
          </Button>
          <Button size="icon" variant="ghost" className="rounded-full">
            <Facebook className="h-5 w-5" />
            <span className="sr-only">Facebook</span>
          </Button>
          <Button size="icon" variant="ghost" className="rounded-full">
            <Twitter className="h-5 w-5" />
            <span className="sr-only">Twitter</span>
          </Button>
        </div>

        {/* Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 justify-items-center">
          {/* Quick Links */}
          <div className="text-center">
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <div className="inline-block text-muted-foreground hover:text-primary transition-colors cursor-pointer">Home</div>
                </Link>
              </li>
              <li>
                <Link href="/events">
                  <div className="inline-block text-muted-foreground hover:text-primary transition-colors cursor-pointer">Concerts</div>
                </Link>
              </li>
              <li>
                <a href="https://nursingrocks.org" target="_blank" rel="noopener noreferrer">
                  <div className="inline-block text-muted-foreground hover:text-primary transition-colors cursor-pointer">NursingRocks.org</div>
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact Us */}
          <div className="text-center">
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <div className="space-y-3 flex flex-col items-center">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  info@nursingrocks.com
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm text-muted-foreground">
                  732 S 6th St, Suite V<br />
                  Las Vegas, NV 89101
                </span>
              </div>
            </div>
          </div>
          
          {/* Newsletter */}
          <div className="text-center">
            <h3 className="text-lg font-bold mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4 mx-auto max-w-xs">
              Subscribe for updates on upcoming concerts.
            </p>
            <div className="flex items-center justify-center space-x-2 max-w-xs mx-auto">
              <Input type="email" placeholder="Email" className="max-w-48" />
              <Button type="submit" size="sm">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="border-t pt-6">
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {currentYear} Nursing Rocks! Concert Series. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
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