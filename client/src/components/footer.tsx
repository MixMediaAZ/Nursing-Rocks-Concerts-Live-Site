import { Link } from "wouter";

const Footer = () => {
  const socialLinks = [
    { icon: "facebook-f", url: "#" },
    { icon: "twitter", url: "#" },
    { icon: "instagram", url: "#" },
    { icon: "spotify", url: "#" },
    { icon: "youtube", url: "#" },
  ];

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Events", href: "#events" },
    { name: "Venues", href: "#venues" },
    { name: "Artists", href: "#artists" },
    { name: "Gallery", href: "#gallery" },
  ];

  const supportLinks = [
    { name: "Contact Us", href: "#" },
    { name: "FAQs", href: "#" },
    { name: "Ticket Info", href: "#" },
    { name: "Accessibility", href: "#" },
    { name: "Venue Policies", href: "#" },
  ];

  const policyLinks = [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Cookie Policy", href: "#" },
  ];

  return (
    <footer className="bg-[#333333] text-white/80">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="text-2xl font-heading font-bold flex items-center">
              <span className="text-[#FF3366]">Nursing</span>
              <span className="text-[#00A3E0]">Rocks!</span>
              <i className="fas fa-heartbeat ml-2 text-white"></i>
            </Link>
            <p className="mt-4 mb-6">
              Experience the magic of live music with Nursing Rocks! From intimate venues to grand arenas, we bring you the best concerts and performances celebrating healthcare heroes.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <a 
                  key={link.icon}
                  href={link.url} 
                  className="text-white hover:text-[#FF3366] transition-colors"
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <i className={`fab fa-${link.icon}`}></i>
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-heading font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-[#FF3366] transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-heading font-bold text-white mb-4">Support</h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="hover:text-[#FF3366] transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-heading font-bold text-white mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <i className="fas fa-map-marker-alt mt-1.5 mr-2"></i>
                <span>123 Music Avenue<br/>New York, NY 10001</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-phone-alt mr-2"></i>
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-envelope mr-2"></i>
                <span>info@nursingrocks.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} Nursing Rocks! Concert Series. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {policyLinks.map((link) => (
              <a 
                key={link.name}
                href={link.href} 
                className="text-sm hover:text-[#FF3366] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
