import { Helmet } from "react-helmet";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

// Pitch deck slides (12)
import slide0 from "@assets/pitch-deck/0_1758828531029-hvQgIknr.jpg";
import slide1 from "@assets/pitch-deck/1_1758828531031-DMgzRFvL.jpg";
import slide2 from "@assets/pitch-deck/2_1758828531031-frBdoLW9.jpg";
import slide3 from "@assets/pitch-deck/3_1758828531032-_6KHYUZA.jpg";
import slide4 from "@assets/pitch-deck/4_1758828531033-CpkSugu5.jpg";
import slide5 from "@assets/pitch-deck/5_1758828531034-B8Ce15Gb.jpg";
import slide6 from "@assets/pitch-deck/6_1758828531035-Bgh1IsTa.jpg";
import slide7 from "@assets/pitch-deck/7_1758828531035-DE8liC_J.jpg";
import slide8 from "@assets/pitch-deck/8_1758828531036-BiPv94LO.jpg";
import slide9 from "@assets/pitch-deck/9_1758828531037-BHRwQbAN.jpg";
import slide10 from "@assets/pitch-deck/10_1758828531038-DK6xrOqg.jpg";
import slide11 from "@assets/pitch-deck/11_1758828531039-DWoUwVdw.jpg";

export default function SponsorsPage() {
  const slides = useMemo(
    () => [
      slide0,
      slide1,
      slide2,
      slide3,
      slide4,
      slide5,
      slide6,
      slide7,
      slide8,
      slide9,
      slide10,
      slide11,
    ],
    [],
  );

  const [idx, setIdx] = useState(0);

  useEffect(() => {}, [slides.length]);

  const safeIdx = Math.max(0, Math.min(idx, slides.length - 1));
  const current = slides[safeIdx];

  return (
    <>
      <Helmet>
        <title>Nursing Rocks! Concert Series - Sponsorship Rocks!</title>
        <meta
          name="description"
          content="Sponsorship pitch deck for the Nursing Rocks! Concert Series."
        />
      </Helmet>

      <div className="py-10 bg-gradient-to-r from-[#5D3FD3]/5 to-[#FF3366]/5">
        <div className="container px-6 md:px-8 flex justify-center">
          <div 
            className="bg-gradient-to-br from-primary/90 to-[hsl(180,65%,35%)] text-white px-4 sm:px-6 md:px-8 py-4 sm:py-6 rounded-xl text-center mx-auto"
            style={{
              border: '4px solid transparent',
              background: 'linear-gradient(135deg, hsl(233, 100%, 27%) 0%, hsl(180, 65%, 35%) 100%) padding-box, linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(0,0,0,0.3) 100%) border-box',
              boxShadow: 'inset 4px 4px 8px rgba(255,255,255,0.3), inset -4px -4px 8px rgba(0,0,0,0.2), 8px 8px 24px rgba(0,0,0,0.25), -4px -4px 12px rgba(255,255,255,0.15)'
            }}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.4), 0 0 20px rgba(255,255,255,0.3)' }}>
              Sponsorship Rocks!
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold mt-3 sm:mt-4 text-white/95" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.3)' }}>
            Browse the sponsorship opportunity deck below.
          </p>
          </div>
        </div>
      </div>

      <div className="container px-6 md:px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
            <div className="relative bg-black">
              <img
                src={current}
                alt={`Pitch deck slide ${safeIdx + 1} of ${slides.length}`}
                className="w-full h-auto"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex items-center justify-between gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setIdx((v) => (v - 1 + slides.length) % slides.length)}
                >
                  Prev
                </Button>
                <div className="text-white text-sm font-medium">
                  Slide {safeIdx + 1} / {slides.length}
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setIdx((v) => (v + 1) % slides.length)}
                >
                  Next
                </Button>
              </div>
            </div>

            <div className="p-4 flex flex-wrap gap-2 justify-center">
              {slides.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setIdx(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    i === safeIdx ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
