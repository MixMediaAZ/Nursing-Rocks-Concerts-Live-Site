import { Clock } from "lucide-react";

const FeaturedArtist = () => {
  return (
    <section id="artists" className="py-16 bg-gradient-to-br from-[#5D3FD3]/5 to-[#FF3366]/5">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold mb-2 text-center">Featured Artist</h2>
        <p className="text-[#333333]/70 text-center mb-12">Get to know our headlining performers</p>

        <div className="max-w-2xl mx-auto text-center py-12">
          <Clock className="h-16 w-16 mx-auto text-primary mb-6 animate-pulse" />
          <h3 className="text-2xl font-bold mb-4">Coming Soon</h3>
          <p className="text-muted-foreground">
            Artist information and upcoming performances are coming soon! Check back later for featured artists, concert dates, and ticket information.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeaturedArtist;
