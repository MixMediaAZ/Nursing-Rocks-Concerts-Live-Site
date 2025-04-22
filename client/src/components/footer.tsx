import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";
import logoPath from "../assets/nursing-rocks-logo.png";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Logo and description - centered on mobile, left-aligned on desktop */}
          <div className="flex flex-col gap-4 items-center md:items-start text-center md:text-left">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <img
                  src={logoPath}
                  alt="Nursing Rocks!"
                  className="h-14 w-auto"
                />
              </div>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Nursing Rocks! Concert Series celebrates healthcare professionals with exclusive music experiences.
            </p>
            <div className="flex items-center gap-2">
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
          </div>
          
          {/* Quick Links - centered on mobile, left-aligned on desktop */}
          <div className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
            <h3 className="text-lg font-bold">Quick Links</h3>
            <ul className="flex flex-col gap-2 items-center md:items-start">
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

              {/* Venue link removed */}

              <li>
                <a href="https://nursingrocks.org" target="_blank" rel="noopener noreferrer">
                  <div className="inline-block text-muted-foreground hover:text-primary transition-colors cursor-pointer">NursingRocks.org</div>
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact Us - centered on mobile, left-aligned on desktop */}
          <div className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
            <h3 className="text-lg font-bold">Contact Us</h3>
            <div className="flex flex-col gap-2 items-center md:items-start">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  info@nursingrocks.com
                </span>
              </div>
              <div className="flex items-center md:items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm text-muted-foreground text-center md:text-left">
                  732 S 6th St<br />
                  Suite V<br />
                  Las Vegas, NV 89101
                </span>
              </div>
            </div>
          </div>
          
          {/* Newsletter - centered on mobile, left-aligned on desktop */}
          <div className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
            <h3 className="text-lg font-bold">Newsletter</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Subscribe to our newsletter for updates on upcoming concerts.
            </p>
            <div className="flex w-full max-w-xs items-center justify-center md:justify-start space-x-2">
              <Input type="email" placeholder="Email" />
              <Button type="submit">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom section */}
        <div className="mt-8 border-t pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {currentYear} Nursing Rocks! Concert Series. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
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