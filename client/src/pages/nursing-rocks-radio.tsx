import { Helmet } from "react-helmet";
import { useEffect, useMemo, useState } from "react";
import { Music, ListMusic, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PlaylistCard } from "@/components/playlist-card";
import {
  playlistsByCategory,
  RADIO_CATEGORY_ORDER,
  RADIO_PLAYLIST_PARAM,
} from "@/lib/nursing-rocks-radio";

export default function NursingRocksRadioPage() {
  // Deep link: /nursing-rocks-radio?p=<playlistId> opens scrolled to that playlist.
  const sharedPlaylistId = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get(RADIO_PLAYLIST_PARAM);
  }, []);

  useEffect(() => {
    if (!sharedPlaylistId) return;
    const el = document.getElementById(`playlist-${sharedPlaylistId}`);
    if (!el) return;
    // Small delay so the featured players and layout settle before scrolling.
    const t = setTimeout(
      () => el.scrollIntoView({ behavior: "smooth", block: "center" }),
      300,
    );
    return () => clearTimeout(t);
  }, [sharedPlaylistId]);

  return (
    <>
      <Helmet>
        <title>Nursing Rocks Radio | Playlists for Nurses</title>
        <meta
          name="description"
          content="Nursing Rocks Radio features Spotify playlists built for nurses, caregivers, shift workers, and music fans who support healthcare professionals."
        />
        <meta property="og:title" content="Nursing Rocks Radio" />
        <meta
          property="og:description"
          content="Choose your shift soundtrack with playlists created for nurses and the Nursing Rocks Concert Series community."
        />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero — mirrors the Sponsors page banner treatment */}
      <div className="py-10 bg-gradient-to-r from-[#5D3FD3]/5 to-[#FF3366]/5">
        <div className="container px-6 md:px-8 flex justify-center">
          <div
            className="bg-gradient-to-br from-primary/90 to-[hsl(180,65%,35%)] text-white px-4 sm:px-6 md:px-8 py-6 sm:py-8 rounded-xl text-center mx-auto max-w-3xl"
            style={{
              border: "4px solid transparent",
              background:
                "linear-gradient(135deg, hsl(233, 100%, 27%) 0%, hsl(180, 65%, 35%) 100%) padding-box, linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(0,0,0,0.3) 100%) border-box",
              boxShadow:
                "inset 4px 4px 8px rgba(255,255,255,0.3), inset -4px -4px 8px rgba(0,0,0,0.2), 8px 8px 24px rgba(0,0,0,0.25), -4px -4px 12px rgba(255,255,255,0.15)",
            }}
          >
            <div className="flex items-center justify-center gap-3 mb-1">
              <Music className="h-7 w-7 sm:h-9 sm:w-9 text-white/95" />
              <h1
                className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold text-white drop-shadow-lg"
                style={{
                  textShadow:
                    "2px 2px 4px rgba(0,0,0,0.4), 0 0 20px rgba(255,255,255,0.3)",
                }}
              >
                Nursing Rocks Radio
              </h1>
            </div>
            <p
              className="text-base sm:text-lg md:text-xl font-semibold mt-3 text-white/95"
              style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.3)" }}
            >
              Playlists built for nurses, caregivers, shift workers, and everyone
              who keeps showing up.
            </p>
            <p className="text-sm sm:text-base mt-3 text-white/90 max-w-2xl mx-auto">
              From pre-shift energy to post-shift decompression, Nursing Rocks Radio
              keeps the music going between concerts. Choose your shift soundtrack,
              discover something familiar, or send us a song that helped you through
              a hard day.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <a href="#playlists">
                  <ListMusic className="mr-2 h-5 w-5" /> Browse the Playlists
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white/15 text-white hover:bg-white/25 border border-white/40"
              >
                <a href="#suggest">
                  <Send className="mr-2 h-5 w-5" /> Suggest a Song
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-6 md:px-8 py-10">
        <div className="max-w-6xl mx-auto space-y-16" id="playlists">
          {RADIO_CATEGORY_ORDER.map((category) => {
            const items = playlistsByCategory(category);
            if (items.length === 0) return null;
            const isFeatured = category === "Featured";
            return (
              <section key={category} className="!py-0">
                <div className="rounded-2xl border border-gray-200 bg-white/85 backdrop-blur-sm shadow-md p-6 sm:p-8">
                  <div className="w-full text-center mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold">{category}</h2>
                  </div>
                  <div className={`grid gap-6 grid-cols-1 ${isFeatured ? "md:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                    {items.map((playlist) => (
                      <PlaylistCard
                        key={playlist.playlistId}
                        playlist={playlist}
                        initialOpen
                        highlight={sharedPlaylistId === playlist.playlistId}
                      />
                    ))}
                  </div>
                </div>
              </section>
            );
          })}

          {/* Suggest a Song */}
          <SuggestASong />
        </div>
      </div>
    </>
  );
}

function SuggestASong() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState("");
  const [song, setSong] = useState("");
  const [story, setStory] = useState("");
  const [email, setEmail] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !song.trim()) {
      toast({
        title: "Almost there",
        description: "Please add your name and a song.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/song-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim(),
          role: role.trim(),
          song: song.trim(),
          story: story.trim(),
          email: email.trim(),
          can_share: canShare,
        }),
      });

      if (res.status === 201) {
        setName("");
        setCity("");
        setRole("");
        setSong("");
        setStory("");
        setEmail("");
        setCanShare(false);
        toast({
          title: "Thank you!",
          description:
            "Your song suggestion was received. We may add nurse picks to a future Nursing Rocks Radio playlist.",
        });
        return;
      }

      const data = await res.json().catch(() => null);
      toast({
        title: "Couldn't submit",
        description: data?.message || "Please try again.",
        variant: "destructive",
      });
    } catch (err) {
      console.error("Song suggestion submit error:", err);
      toast({
        title: "Couldn't submit",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="suggest" className="!py-0">
      <div className="rounded-xl border bg-white p-6 sm:p-8 shadow-md max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">
            What song got you through a hard shift?
          </h2>
          <p className="text-muted-foreground mt-2">
            Tell us the song that helped you reset, recover, rage, cry, laugh, or
            keep going. We may add nurse-submitted picks to future Nursing Rocks
            Radio playlists.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="srs-name">First name *</Label>
              <Input
                id="srs-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="srs-city">City</Label>
              <Input
                id="srs-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={200}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="srs-role">Role / unit (optional)</Label>
              <Input
                id="srs-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                maxLength={200}
                placeholder="ICU, ER, Peds…"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="srs-email">Email (optional)</Label>
              <Input
                id="srs-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={200}
                placeholder="So we can tell you if it's added"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="srs-song">Song *</Label>
            <Input
              id="srs-song"
              value={song}
              onChange={(e) => setSong(e.target.value)}
              maxLength={300}
              required
              placeholder="Song title — Artist"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="srs-story">Your story (optional)</Label>
            <Textarea
              id="srs-story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="What made this song matter?"
              className="mt-1.5"
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={canShare}
              onChange={(e) => setCanShare(e.target.checked)}
              className="mt-1"
            />
            <span>
              You can share my first name, city, and story on Nursing Rocks
              social media or playlists.
            </span>
          </label>

          <div className="flex justify-center pt-2">
            <Button type="submit" size="lg" disabled={submitting}>
              <Send className="mr-2 h-5 w-5" />
              {submitting ? "Sending…" : "Suggest a Song"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
