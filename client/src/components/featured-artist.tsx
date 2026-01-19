import { Clock } from "lucide-react";

const FeaturedArtist = () => {
  return (
    <section id="artists" className="py-16 bg-gradient-to-br from-[#5D3FD3]/5 to-[#FF3366]/5">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="border border-gray-300 rounded-lg p-6 bg-white/10 shadow-sm">
            <div className="text-center py-8">
              <Clock className="h-16 w-16 mx-auto text-primary mb-6 animate-pulse" />
              <h3 className="text-2xl font-bold mb-4">Coming Soon</h3>
              <p className="text-muted-foreground">
                Artist information and upcoming performances are coming soon! Check back later for featured artists, concert dates, and ticket information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedArtist;
