import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Play, ChevronUp, AlertTriangle, Heart } from "lucide-react";
import { SpotifyEmbed } from "./spotify-embed";
import { SharePlaylistButton } from "./share-playlist-button";
import { spotifyOpenUrl, type RadioPlaylist } from "@/lib/nursing-rocks-radio";

interface PlaylistCardProps {
  playlist: RadioPlaylist;
  /** Open the player on mount (used when this is the shared/deep-linked card). */
  initialOpen?: boolean;
  /** Visually highlight the card (used when this is the shared/deep-linked card). */
  highlight?: boolean;
  /** Total like count from the server. */
  likeCount?: number;
  /** Whether the current user has already liked this playlist. */
  isLiked?: boolean;
  /** Called when the user clicks the heart. */
  onLike?: () => void;
}

/**
 * A single playlist card. The Spotify player is lazy: the iframe is only mounted
 * after the user clicks "Preview here", keeping the page light on first load.
 */
export function PlaylistCard({ playlist, initialOpen = false, highlight = false, likeCount, isLiked = false, onLike }: PlaylistCardProps) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <Card
      id={`playlist-${playlist.playlistId}`}
      className={`flex h-full flex-col border bg-background shadow-sm transition-shadow hover:shadow-md scroll-mt-24 ${
        highlight ? "ring-2 ring-primary ring-offset-2" : ""
      }`}
    >
      <CardContent className="flex flex-grow flex-col p-5">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="m-0 max-w-none text-left text-lg font-bold leading-snug">
            {playlist.title}
          </h3>
          {playlist.explicitWarning && (
            <Badge
              variant="outline"
              className="shrink-0 gap-1 border-[hsl(350,80%,55%)]/40 text-[hsl(350,80%,45%)]"
            >
              <AlertTriangle className="h-3 w-3" /> Explicit
            </Badge>
          )}
        </div>

        <p className="mx-0 mb-4 max-w-none flex-grow text-left text-sm text-muted-foreground">
          {playlist.subtitle}
        </p>

        {open && (
          <div className="mb-4">
            <SpotifyEmbed playlistId={playlist.playlistId} title={playlist.title} height={152} />
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            {open ? (
              <>
                <ChevronUp className="mr-1 h-4 w-4" /> Hide
              </>
            ) : (
              <>
                <Play className="mr-1 h-4 w-4" /> Preview here
              </>
            )}
          </Button>
          <Button size="sm" asChild>
            <a
              href={spotifyOpenUrl(playlist.playlistId)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-1 h-4 w-4" /> Play on Spotify
            </a>
          </Button>
          <SharePlaylistButton playlist={playlist} />
          <Button
            size="sm"
            variant="ghost"
            onClick={onLike}
            disabled={isLiked || !onLike}
            aria-label={isLiked ? "Liked" : `Like ${playlist.title}`}
            className={`gap-1 ${isLiked ? "text-red-500 hover:text-red-500" : "text-muted-foreground hover:text-red-400"}`}
          >
            <Heart className={`h-4 w-4 transition-all ${isLiked ? "fill-red-500 text-red-500 scale-110" : ""}`} />
            {likeCount ? likeCount : ""}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
