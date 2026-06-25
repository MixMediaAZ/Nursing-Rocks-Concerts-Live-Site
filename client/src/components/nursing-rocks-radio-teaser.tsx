import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Radio, Music } from "lucide-react";

/**
 * Compact home-page teaser for Nursing Rocks Radio. Intentionally light — it
 * points to the full /nursing-rocks-radio hub rather than embedding players.
 */
export default function NursingRocksRadioTeaser() {
  return (
    <section className="bg-background py-6 sm:py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-2xl text-white p-6 sm:p-8 text-center shadow-md"
            style={{
              background:
                "linear-gradient(135deg, hsl(233, 100%, 27%) 0%, hsl(180, 65%, 35%) 100%)",
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Radio className="h-6 w-6 text-white/95" />
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Music for Every Shift
              </h2>
            </div>
            <p className="text-white/95 max-w-2xl mx-auto">
              Nursing Rocks Radio is a collection of playlists built for nurses,
              caregivers, shift workers, and everyone who keeps showing up. Pick a
              soundtrack for pre-shift energy, post-shift recovery, night-shift
              fuel, rock release, or feel-good downtime.
            </p>
            <div className="mt-5 flex justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link href="/nursing-rocks-radio">
                  <Music className="mr-2 h-5 w-5" /> Listen to Nursing Rocks Radio
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
