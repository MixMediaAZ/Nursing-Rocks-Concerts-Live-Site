import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, Mail, Phone, MapPin, Instagram, Facebook, Twitter, Lock, LogOut, LayoutDashboard } from "lucide-react";
import logoPath from "../assets/nursing-rocks-logo.png";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [isAdmin, setIsAdmin] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  // Check if user is in admin mode
  useEffect(() => {
    const checkAdminStatus = () => {
      const adminStatus = localStorage.getItem("isAdmin") === "true";
      setIsAdmin(adminStatus);
    };
    
    // Initial check
    checkAdminStatus();
    
    // Listen for changes to admin status
    window.addEventListener('admin-mode-changed', checkAdminStatus);
    window.addEventListener('storage', checkAdminStatus);
    
    return () => {
      window.removeEventListener('admin-mode-changed', checkAdminStatus);
      window.removeEventListener('storage', checkAdminStatus);
    };
  }, []);
  
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="page-container content-wrapper py-6 md:py-10 mx-auto">
        {/* Logo and Tagline Section */}
        <div className="mb-8">
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 flex flex-col md:flex-row items-center justify-center gap-4">
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
                <Link href="/">
                  <div className="inline-block text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">Concerts</div>
                </Link>
              </li>
              <li>
                <a href="https://nurse-appreciation-platform-mixmediaaz.replit.app/" target="_blank" rel="noopener noreferrer">
                  <div className="inline-block text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">NursingRocks.org</div>
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact Us */}
          <div className="text-center">
            <Link href="/contact">
              <div className="text-base font-bold mb-3 cursor-pointer hover:text-primary transition-colors">
                Contact Us
              </div>
            </Link>
            <div className="space-y-2 flex flex-col items-center">
              <Link href="/contact">
                <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Bernd Haber worldstringspromotion@gmail.com</span>
                </div>
              </Link>
            </div>
          </div>
          
          {/* Newsletter */}
          <div className="text-center">
            <h3 className="text-base font-bold mb-3">Newsletter coming soon</h3>
            <p className="text-sm text-muted-foreground mb-3 mx-auto">
              Updates on upcoming concerts
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2 max-w-xs mx-auto">
              <Input
                type="email"
                placeholder="Email"
                className="h-9 text-sm"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                className="h-9 text-sm w-full sm:w-auto"
                disabled={isSubscribing}
                onClick={async () => {
                  const email = newsletterEmail.trim();
                  if (!email) {
                    toast({ title: "Email required", description: "Please enter your email." });
                    return;
                  }

                  setIsSubscribing(true);
                  try {
                    const res = await fetch("/api/subscribe", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email }),
                    });

                    if (res.status === 201) {
                      setNewsletterEmail("");
                      toast({
                        title: "Subscribed",
                        description: "You’re on the list for upcoming concert updates.",
                      });
                      return;
                    }

                    if (res.status === 409) {
                      toast({
                        title: "Already subscribed",
                        description: "That email is already subscribed.",
                      });
                      return;
                    }

                    const data = await res.json().catch(() => null);
                    toast({
                      title: "Subscribe failed",
                      description: data?.message || "Please try again.",
                      variant: "destructive",
                    });
                  } catch (err) {
                    console.error("Newsletter subscribe error:", err);
                    toast({
                      title: "Subscribe failed",
                      description: "Please try again.",
                      variant: "destructive",
                    });
                  } finally {
                    setIsSubscribing(false);
                  }
                }}
              >
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
              {isAdmin ? (
                <>
                  <Link href="/admin">
                    <div className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer border border-primary/30 rounded-md px-2 py-1 flex items-center justify-center gap-1">
                      <LayoutDashboard className="h-3 w-3" /> Dashboard
                    </div>
                  </Link>
                  <div 
                    className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors cursor-pointer border border-red-300 rounded-md px-2 py-1 flex items-center justify-center gap-1"
                    onClick={() => {
                      // Perform admin logout
                      fetch('/api/admin/logout', { method: 'POST' })
                        .then(() => {
                          // Clear all admin-related local storage items
                          localStorage.removeItem('adminToken');
                          localStorage.removeItem('isAdmin');
                          localStorage.removeItem('adminPinVerified');
                          localStorage.removeItem('editMode');
                          
                          // Show success toast
                          toast({
                            title: 'Logged Out',
                            description: 'You have been logged out of admin mode',
                          });
                          
                          // Reload page to ensure all admin components are unmounted
                          window.location.reload();
                        })
                        .catch(err => {
                          console.error('Logout error:', err);
                          toast({
                            title: 'Logout Failed',
                            description: 'There was an error logging out. Please try again.',
                            variant: 'destructive',
                          });
                        });
                    }}
                  >
                    <LogOut className="h-3 w-3" /> Admin Logout
                  </div>
                </>
              ) : (
                <Link href="/admin" className="no-underline">
                  <div className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer border border-primary/30 rounded-md px-2 py-1 flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" /> Admin Login
                  </div>
                </Link>
              )}
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