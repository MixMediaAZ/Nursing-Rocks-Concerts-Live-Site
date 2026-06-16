import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin } from "lucide-react";
import ComingSoonPage from "./coming-soon";
import TaggedGallery from "@/components/tagged-gallery";
import PhoenixSlideshow from "@/components/phoenix-slideshow";

// Known event slugs/ids that have curated photo galleries.
// Tag photos in Admin → Gallery with the matching `tag` value to populate.
const EVENT_GALLERIES: Record<
  string,
  { tag: string; title: string; subtitle: string; eventName: string; date?: string; venue?: string }
> = {
  phoenix: {
    tag: "phoenix",
    eventName: "Nursing Rocks — Phoenix",
    title: "Photos from the Phoenix Show",
    subtitle: "Relive the night — featuring The Black Moods, The Central Line, Jane 'N The Jungle, and more.",
    date: "Saturday, May 16, 2026",
    venue: "The Walter Studio, Phoenix AZ",
  },
  // Add future events here, e.g.:
  // "2": { tag: "vegas", eventName: "Nursing Rocks — Vegas", title: "Photos from Vegas", subtitle: "..." },
};

const EventDetails = () => {
  const [, params] = useRoute("/events/:id");
  const id = params?.id ?? "";

  // Try fetching the event record (best-effort; falls back to static mapping).
  // Only fetch if this isn't a known static event (phoenix, etc).
  const { data: event } = useQuery<any>({
    queryKey: [`/api/events/${id}`],
    enabled: Boolean(id) && !EVENT_GALLERIES[id.toLowerCase()],
    retry: false,
  });

  const config = EVENT_GALLERIES[id.toLowerCase()];

  // Unknown event → keep prior coming-soon behavior so we don't ship a broken page.
  if (!config && !event) {
    return (
      <ComingSoonPage
        title="Event Details"
        description="Event information is coming soon! Check back later for concert dates, artist lineups, and ticket information."
      />
    );
  }

  const name = event?.name || config?.eventName || "Event";
  const date = event?.date || config?.date;
  const venue = event?.venue || event?.location || config?.venue;

  const isPhoenix = id.toLowerCase() === "phoenix";

  return (
    <div className="bg-white min-h-screen">
      {/* Hero: photo slideshow for Phoenix, gradient header for everything else */}
      {isPhoenix ? (
        <PhoenixSlideshow
          heading={name}
          subheading={[date, venue].filter(Boolean).join(" · ")}
        />
      ) : (
        <section className="bg-gradient-to-br from-[#5D3FD3] to-[#3a26a3] text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">{name}</h1>
            <div className="flex flex-wrap justify-center gap-6 text-white/90 text-sm md:text-base">
              {date && (
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <span>{date}</span>
                </div>
              )}
              {venue && (
                <div className="flex items-center gap-2">
                  <MapPin size={18} />
                  <span>{venue}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Photo gallery — only renders when we have a tag mapping for this event */}
      {config && (
        <TaggedGallery
          tag={config.tag}
          title={config.title}
          subtitle={config.subtitle}
          initialCount={8}
        />
      )}
    </div>
  );
};

export default EventDetails;
