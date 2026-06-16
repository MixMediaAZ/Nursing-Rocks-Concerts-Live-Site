import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gallery } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Search, X, ImageIcon, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface TaggedGalleryProps {
  /** Tag to filter gallery items by (case-insensitive). */
  tag: string;
  /** Section heading. */
  title?: string;
  /** Subheading shown under the title. */
  subtitle?: string;
  /** Initial image count to show before "View More". */
  initialCount?: number;
  /** Hide entire section when no images match. Defaults to false. */
  hideWhenEmpty?: boolean;
  /** Optional "View all" link shown below the grid (hidden together with section when empty). */
  viewAllHref?: string;
  /** Label for the viewAllHref button. */
  viewAllLabel?: string;
}

const SafeImg = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt || "Concert image"}
      className={className}
      loading="lazy"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        const parent = target.parentElement;
        if (parent) {
          const placeholder = document.createElement("div");
          placeholder.className = target.className + " flex items-center justify-center bg-gray-100";
          placeholder.innerHTML = '<span class="text-gray-400 text-sm">Image unavailable</span>';
          parent.replaceChild(placeholder, target);
        }
      }}
    />
  );
};

const Tile = ({ image }: { image: Gallery }) => {
  if (!image || !image.image_url) return null;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative group overflow-hidden rounded-lg cursor-pointer">
          <SafeImg
            src={image.image_url}
            alt={image.alt_text || "Concert moment"}
            className="w-full h-60 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-[#5D3FD3]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white/90 rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <Search className="text-[#5D3FD3]" size={16} />
            </div>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-0 bg-transparent border-none">
        <div className="relative">
          <SafeImg
            src={image.image_url}
            alt={image.alt_text || "Concert moment"}
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 rounded-full bg-white/20 hover:bg-white/40 text-white"
            aria-label="Close"
          >
            <X size={20} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Renders a gallery grid filtered to images that carry a given tag
 * (matched against `tags[]`, `alt_text`, or `image_url`, case-insensitive).
 *
 * Designed for event-specific embeds, e.g. the Phoenix show on /events/:id.
 * Upload photos via Admin → Gallery and tag them with the matching string
 * (e.g. "phoenix") for them to appear here.
 */
export default function TaggedGallery({
  tag,
  title = "Photos",
  subtitle,
  initialCount = 8,
  hideWhenEmpty = false,
  viewAllHref,
  viewAllLabel = "View full album",
}: TaggedGalleryProps) {
  const { data, isLoading } = useQuery({ queryKey: ["/api/gallery"] });
  const [visible, setVisible] = useState(initialCount);

  const all: any[] = Array.isArray(data)
    ? data
    : data && typeof data === "object" && "rows" in (data as any) && Array.isArray((data as any).rows)
    ? (data as any).rows
    : [];

  const needle = tag.toLowerCase();
  const matches: Gallery[] = all.filter((img) => {
    if (!img || typeof img !== "object" || !("id" in img) || !("image_url" in img)) return false;
    const tagHit =
      Array.isArray(img.tags) &&
      img.tags.some((t: string) => typeof t === "string" && t.toLowerCase().includes(needle));
    const altHit = typeof img.alt_text === "string" && img.alt_text.toLowerCase().includes(needle);
    const urlHit = typeof img.image_url === "string" && img.image_url.toLowerCase().includes(needle);
    return tagHit || altHit || urlHit;
  });

  if (!isLoading && hideWhenEmpty && matches.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold mb-2 text-center">{title}</h2>
        {subtitle && <p className="text-[#333333]/70 text-center mb-12">{subtitle}</p>}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: initialCount }).map((_, i) => (
              <Skeleton key={i} className="h-60 w-full rounded-lg" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-muted-foreground">Photos coming soon — check back shortly.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {matches.slice(0, visible).map((image) => (
                <Tile key={image.id} image={image} />
              ))}
            </div>
            {visible < matches.length && (
              <div className="text-center mt-10">
                <Button
                  onClick={() => setVisible((v) => v + initialCount)}
                  className="bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white font-accent font-semibold py-3 px-8 rounded-full"
                >
                  <span>View More Photos</span>
                  <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </div>
            )}
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
          </>
        )}
      </div>
    </section>
  );
}
