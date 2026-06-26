// Nursing Rocks Radio — playlist catalog.
//
// This file is the single source of truth for the /nursing-rocks-radio page.
// To add, remove, reorder, or re-feature a playlist, edit ONLY this file:
//   - Set `featured: true` to surface a playlist (with its player visible) at the
//     top of the page. The featured row is driven entirely by this flag.
//   - `category` controls which section a card appears in. Categories render in
//     the order defined by RADIO_CATEGORY_ORDER below.
//   - Set `explicitWarning: true` to show an "Explicit" badge on the card.

export interface RadioPlaylist {
  /** Section the card belongs to (must match a value in RADIO_CATEGORY_ORDER). */
  category: string;
  title: string;
  subtitle: string;
  /** Spotify playlist ID (the part after /playlist/ in the share URL). */
  playlistId: string;
  /** When true, the playlist is shown in the visible "Featured" row up top. */
  featured?: boolean;
  /** When true, shows an adult-language / explicit-content badge. */
  explicitWarning?: boolean;
}

/** Order in which category sections render on the page. */
export const RADIO_CATEGORY_ORDER = [
  "Featured",
  "Rock / High Energy",
  "Era Playlists",
  "Mood / Recovery / Variety",
  "Native / Resilience Spotlight",
] as const;

export const nursingRocksPlaylists: RadioPlaylist[] = [
  // ── Featured ──────────────────────────────────────────────────────────────
  {
    category: "Featured",
    title: "Fun to Be Had",
    subtitle: "A friendly starting point for the Nursing Rocks Radio experience.",
    playlistId: "3mLAFcc9VWoN0KYKB8FkRQ",
    featured: true,
  },
  {
    category: "Featured",
    title: "Code Blue Rock",
    subtitle: "Main Nursing Rocks energy: loud, alive, and built for rock fans.",
    playlistId: "0KnJNxmpyBjLUCVcCpDBOM",
    featured: true,
  },
  {
    category: "Featured",
    title: "R&B Essentials",
    subtitle: "Smooth essentials for essential nurses.",
    playlistId: "7IE4Mab1eXyuEDO7GKGxfe",
    featured: true,
  },
  {
    category: "Featured",
    title: "Jazz-tastic",
    subtitle: "Timeless, classic, and calmer listening.",
    playlistId: "1Sjyd4oJfeDcjDjxhHmMVm",
    featured: true,
  },

  // ── Rock / High Energy ────────────────────────────────────────────────────
  {
    category: "Rock / High Energy",
    title: "Deep Cuts / Vinyl Days",
    subtitle: "For listeners who like the deeper catalog.",
    playlistId: "5BCoFG6M1rv62dIZIqG0ly",
  },
  {
    category: "Rock / High Energy",
    title: "B-Sides You",
    subtitle: "Flip it over and find something less obvious.",
    playlistId: "2NPoxuKYe6MmFqSQ7X104q",
  },
  {
    category: "Rock / High Energy",
    title: "One Hit Is Enough",
    subtitle: "Familiar hits, fast recognition, easy fun.",
    playlistId: "5RwN6OWo8Tzf2kqiac4i8P",
  },
  {
    category: "Rock / High Energy",
    title: "Metal Medics",
    subtitle: "Hard rock and metal for high-volume release.",
    playlistId: "3qXkDLvhWRP0VsHVEq6b7s",
  },
  {
    category: "Rock / High Energy",
    title: "Boys Being Boys",
    subtitle: "Loud, loose, and built for inside-voice failure.",
    playlistId: "0JWkT2dGYs4JdtpHH9LSqu",
  },
  {
    category: "Rock / High Energy",
    title: "1980s Big Hair",
    subtitle: "Big hooks, big guitars, big 80s energy.",
    playlistId: "1x8WXiFcz7FSDcDe0tSGYe",
    explicitWarning: true,
  },

  // ── Era Playlists ─────────────────────────────────────────────────────────
  {
    category: "Era Playlists",
    title: "1980s Ladies",
    subtitle: "Danceable 80s energy with female-led flavor.",
    playlistId: "1Aidhdcst3j0TPctbq5pMR",
  },
  {
    category: "Era Playlists",
    title: "1980s New Wave",
    subtitle: "Good-times 80s new wave energy.",
    playlistId: "5Vi7DZ3kD3YqqLv81Mc7Jm",
  },
  {
    category: "Era Playlists",
    title: "1990s Flannel Invasion",
    subtitle: "Grunge-era soundtrack for the flannel years.",
    playlistId: "2ZhWRjYdCXCZlCPA5d4FZZ",
  },
  {
    category: "Era Playlists",
    title: "1990s Forever Alt",
    subtitle: "Alternative rock from the better-than-the-alternatives era.",
    playlistId: "3RIAM8t7No7s1PtENjz83S",
  },
  {
    category: "Era Playlists",
    title: "2000s New Millennium",
    subtitle: "Y2K and 2000s energy.",
    playlistId: "6v6JFgwXaTjY0znQth1JEA",
  },

  // ── Mood / Recovery / Variety ─────────────────────────────────────────────
  {
    category: "Mood / Recovery / Variety",
    title: "Feeling Yachty",
    subtitle: "Smooth emotional waves for softer listening.",
    playlistId: "7faBK1dIaBISP17FCryHvY",
  },
  {
    category: "Mood / Recovery / Variety",
    title: "Love of Country",
    subtitle: "Country-leaning songs for nurses who want to dance.",
    playlistId: "1kMqA20ClExobJHBNkRo2G",
  },
  {
    category: "Mood / Recovery / Variety",
    title: "Cutting Scars",
    subtitle: "Edgier playlist. Adult language / content warning.",
    playlistId: "7rG5HuR2F03O8U7wwX78qc",
    explicitWarning: true,
  },

  // ── Native / Resilience Spotlight ─────────────────────────────────────────
  {
    category: "Native / Resilience Spotlight",
    title: "Rez Rock Resilience",
    subtitle: "Native American bands and resilience themes.",
    playlistId: "06dEOcTeYilYQoV5bIfpzu",
  },
  {
    category: "Native / Resilience Spotlight",
    title: "Rock Resilience Reloaded",
    subtitle: "Native spotlight continuation playlist.",
    playlistId: "5gSNlH4CUnkYyyEfK3VTHx",
  },
];

/** Featured playlists (player visible), driven by the `featured` flag. */
export const featuredPlaylists = nursingRocksPlaylists.filter((p) => p.featured);

/** Playlists for a given category, in catalog order. */
export function playlistsByCategory(category: string): RadioPlaylist[] {
  return nursingRocksPlaylists.filter((p) => p.category === category);
}

export const spotifyEmbedUrl = (playlistId: string) =>
  `https://open.spotify.com/embed/playlist/${playlistId}`;

export const spotifyOpenUrl = (playlistId: string) =>
  `https://open.spotify.com/playlist/${playlistId}`;

/** Query-string key used to deep-link a specific playlist on the radio page. */
export const RADIO_PLAYLIST_PARAM = "p";

/**
 * On-site deep link to a specific playlist. Opening it loads the Nursing Rocks
 * Radio page scrolled to that playlist with its player ready. Uses the current
 * origin so the link is correct in dev, preview, and production.
 */
export const radioShareUrl = (playlistId: string) => {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://www.nursingrocksconcerts.com";
  return `${origin}/nursing-rocks-radio?${RADIO_PLAYLIST_PARAM}=${playlistId}`;
};
