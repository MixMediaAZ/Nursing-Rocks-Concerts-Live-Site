import { spotifyEmbedUrl } from "@/lib/nursing-rocks-radio";

interface SpotifyEmbedProps {
  playlistId: string;
  /** Used for the iframe's accessible title. */
  title: string;
  /** 152 = compact one-row player, 352 = full player. Defaults to 352. */
  height?: number;
}

/**
 * Responsive, lazy-loaded Spotify playlist player.
 *
 * The iframe uses native lazy loading and is only ever rendered by callers when
 * a user opens a card (or for the featured row), so the page never mounts all
 * players at once.
 */
export function SpotifyEmbed({ playlistId, title, height = 352 }: SpotifyEmbedProps) {
  return (
    <iframe
      src={spotifyEmbedUrl(playlistId)}
      width="100%"
      height={height}
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      title={`Spotify player: ${title}`}
      className="w-full rounded-xl"
      style={{ border: 0 }}
    />
  );
}
