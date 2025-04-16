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
          <div className="flex flex-col gap-4">
            <Link href="/">
              <a className="flex items-center gap-2">
                <img
                  src={logoPath}
                  alt="Nursing Rocks!"
                  className="h-14 w-auto"
                />
              </a>
            </Link>
            <p className="text-sm text-muted-foreground">
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
          
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold">Quick Links</h3>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/" className="hover:underline text-muted-foreground hover:text-primary">
                  <a className="inline-block text-muted-foreground hover:text-primary transition-colors">Home</a>
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:underline text-muted-foreground hover:text-primary">
                  <a className="inline-block text-muted-foreground hover:text-primary transition-colors">Concerts</a>
                </Link>
              </li>
              <li>
                <Link href="/artists" className="hover:underline text-muted-foreground hover:text-primary">
                  <a className="inline-block text-muted-foreground hover:text-primary transition-colors">Artists</a>
                </Link>
              </li>
              <li>
                <Link href="/venues" className="hover:underline text-muted-foreground hover:text-primary">
                  <a className="inline-block text-muted-foreground hover:text-primary transition-colors">Venues</a>
                </Link>
              </li>
              <li>
                <Link href="/license" className="hover:underline text-muted-foreground hover:text-primary">
                  <a className="inline-block text-muted-foreground hover:text-primary transition-colors">License Verification</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold">Contact Us</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  (800) NURSING
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  info@nursingrocks.com
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm text-muted-foreground">
                  123 Healthcare Ave<br />
                  Suite 456<br />
                  Medical City, CA 90210
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold">Newsletter</h3>
            <p className="text-sm text-muted-foreground">
              Subscribe to our newsletter for updates on upcoming concerts.
            </p>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="email" placeholder="Email" />
              <Button type="submit">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {currentYear} Nursing Rocks! Concert Series. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/terms">
                <a className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </Link>
              <Link href="/privacy">
                <a className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </Link>
              <Link href="/faq">
                <a className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </a>
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