import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { phoenixPhotos } from "@/lib/phoenix-photos";

// Fisher-Yates shuffle — runs once at module load, so order is random per page load
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const slides = shuffle(
  phoenixPhotos.map((m) => ({ url: m.url, thumbnail_url: m.thumbnail_url, alt_text: m.alt_text }))
);

const AUTOPLAY_MS = 5000;
const SLIDE_HEIGHT = "min(75vh, 760px)";

interface PhoenixSlideshowProps {
  heading?: string;
  subheading?: string;
}

export default function PhoenixSlideshow({
  heading = "Nursing Rocks — Phoenix",
  subheading = "Saturday, May 16, 2026 · The Walter Studio",
}: PhoenixSlideshowProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = slides.length;

  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const goTo = useCallback((i: number) => setCurrent(i), []);

  // Autoplay
  useEffect(() => {
    if (isPaused || total <= 1) return;
    timerRef.current = setInterval(next, AUTOPLAY_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPaused, next, total]);

  if (total === 0) return null;

  return (
    <section
      className="relative w-full overflow-hidden bg-black"
      style={{ height: SLIDE_HEIGHT }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Nursing Rocks Phoenix photo slideshow"
    >
      {/* Slides — only the active one is visible; others are hidden via opacity */}
      {slides.map((slide, i) => (
        <div
          key={slide.url}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}
          aria-hidden={i !== current}
        >
          <img
            src={slide.url}
            alt={slide.alt_text}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              backgroundColor: "#000",
            }}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        </div>
      ))}

      {/* Bottom gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{ height: 160, background: "linear-gradient(to top, rgba(0,0,0,0.72), transparent)" }}
      />

      {/* Title */}
      <div className="pointer-events-none absolute inset-x-0 bottom-14 px-4 text-center">
        <h1 className="font-heading text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
          {heading}
        </h1>
        {subheading && (
          <p className="mt-3 text-base md:text-xl text-white/90 drop-shadow">{subheading}</p>
        )}
      </div>

      {/* Prev / Next */}
      {total > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/40 text-white hover:bg-black/60 z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/40 text-white hover:bg-black/60 z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
