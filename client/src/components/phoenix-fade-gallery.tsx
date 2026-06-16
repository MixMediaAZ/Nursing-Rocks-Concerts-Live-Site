/**
 * PhoenixFadeGallery
 *
 * 4-slot grid. Each slot holds two stacked <img> layers.
 * To swap: load the next photo into the back layer, then crossfade
 * the front layer's opacity 1→0 (revealing the back). Classic crossfade —
 * both images are visible simultaneously during the transition.
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { phoenixPhotos } from "@/lib/phoenix-photos";

const SLOTS       = 4;     // visible tiles
const HOLD_MS     = 7000;  // ms each photo is fully visible
const FADE_MS     = 2500;  // crossfade duration (both layers simultaneously)
const STAGGER_MS  = 1750;  // offset between each slot's first swap

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const allUrls = phoenixPhotos.map((p) => p.url);

// ─── single tile ─────────────────────────────────────────────────────────────

function FadingSlot({ initialDelay }: { initialDelay: number }) {
  // Two src slots; we alternate which is "front" (opacity 1)
  const [srcs, setSrcs] = useState<[string, string]>(() => {
    const deck = shuffle(allUrls);
    return [deck[0], deck[1]];
  });
  const [front, setFront] = useState<0 | 1>(0);

  // Refs so the interval callback always has fresh values without re-registering
  const frontRef  = useRef<0 | 1>(0);
  const deckRef   = useRef(shuffle(allUrls));
  const posRef    = useRef(2); // deck[0] and deck[1] already used as initial srcs

  const nextFromDeck = () => {
    if (posRef.current >= deckRef.current.length) {
      deckRef.current = shuffle(allUrls);
      posRef.current  = 0;
    }
    return deckRef.current[posRef.current++];
  };

  useEffect(() => {
    const intervalRef: { id: ReturnType<typeof setInterval> | null } = { id: null };

    const swap = () => {
      const incoming = (frontRef.current === 0 ? 1 : 0) as 0 | 1;
      const next     = nextFromDeck();

      // 1. Load next image into the BACK layer (no visual change yet)
      setSrcs((prev) => {
        const s: [string, string] = [prev[0], prev[1]];
        s[incoming] = next;
        return s;
      });

      // 2. Small delay so the browser has time to decode the new src
      //    before we start fading (prevents flash of old image)
      setTimeout(() => {
        frontRef.current = incoming;
        setFront(incoming);
      }, 80);
    };

    const initTimer = setTimeout(() => {
      swap();
      intervalRef.id = setInterval(swap, HOLD_MS + FADE_MS);
    }, initialDelay);

    return () => {
      clearTimeout(initTimer);
      if (intervalRef.id) clearInterval(intervalRef.id);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative overflow-hidden rounded-lg h-60 bg-black">
      {([0, 1] as const).map((i) => (
        <img
          key={i}
          src={srcs[i]}
          alt="Nursing Rocks Phoenix 2026"
          style={{
            position:   "absolute",
            inset:      0,
            width:      "100%",
            height:     "100%",
            objectFit:  "cover",
            opacity:    i === front ? 1 : 0,
            transition: `opacity ${FADE_MS}ms ease-in-out`,
            zIndex:     i === front ? 2 : 1,
          }}
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>
  );
}

// ─── section wrapper ──────────────────────────────────────────────────────────

interface PhoenixFadeGalleryProps {
  title?:       string;
  subtitle?:    string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export default function PhoenixFadeGallery({
  title       = "Recent Show: Phoenix",
  subtitle    = "A night to remember at The Walter Studio — May 16, 2026.",
  viewAllHref = "/events/phoenix",
  viewAllLabel = "View full Phoenix album",
}: PhoenixFadeGalleryProps) {
  if (allUrls.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold mb-2 text-center">{title}</h2>
        {subtitle && <p className="text-[#333333]/70 text-center mb-2">{subtitle}</p>}
        <p className="text-[#333333] text-sm text-center mb-12">Sponsored by Phoenix Children's Hospital</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: SLOTS }).map((_, i) => (
            <FadingSlot key={i} initialDelay={i * STAGGER_MS} />
          ))}
        </div>

        {viewAllHref && (
          <div className="text-center mt-8">
            <Link href={viewAllHref}>
              <Button
                variant="outline"
                className="border-[#5D3FD3] text-[#5D3FD3] hover:bg-[#5D3FD3] hover:text-white gap-2"
              >
                {viewAllLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
