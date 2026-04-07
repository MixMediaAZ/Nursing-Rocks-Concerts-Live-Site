import { Music, MapPin, Calendar, Gift, Clock, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "wouter";

const FeaturedArtist = () => {
  const lineup = [
    { type: "band", name: "The Black Moods", url: "https://theblackmoods.com/" },
    { type: "band", name: "The Central Line", url: "https://azpbs.org/horizon/2023/12/all-doctor-band-the-central-line-made-up-of-phoenix-childrens-hospital-doctors/" },
    { type: "band", name: "Jane 'n the Jungle", url: "https://www.janenthejungle.com/" },
    { type: "band", name: "PsychoStar", url: "https://linktr.ee/psychostar" },
    { type: "band", name: "My Upside Down", url: "https://linktr.ee/myupsidedown?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnMjHDfeOnXd7lbqhPbfsQzdUxgvFu46D58LJjH2KOfvVwopesIARMimTBETU_aem_eimjH1K9n_Kz-aRWTR0izg" },
    { type: "dj", name: "Casual Alien", url: "https://casualalien.bandzoogle.com/" },
    { type: "dj", name: "Oppsie Daisy", url: "https://www.instagram.com/nickbornhoft/" }
  ];
  const bandLineup = lineup.filter((artist) => artist.type === "band");
  const djLineup = lineup.filter((artist) => artist.type === "dj");

  return (
    <section id="artists" className="py-16 bg-gradient-to-br from-[#5D3FD3]/5 to-[#FF3366]/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Phoenix Event Banner */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Poster Image */}
              <div className="flex items-center justify-center">
                <img
                  src="/assets/NRCS Phoenix Poster 1.PNG"
                  alt="Nursing Rocks Phoenix 2026"
                  className="w-full h-auto max-w-sm rounded-lg shadow-md object-cover"
                />
              </div>

              {/* Event Details */}
              <div className="flex flex-col justify-center space-y-4">
                <div>
                  <h3 className="text-3xl font-bold mb-2">Nursing Rocks Phoenix</h3>
                  <p className="text-lg text-gray-600 font-medium">A sponsored concert event celebrating nurses and the nursing profession!</p>
                </div>

                <div className="space-y-3 py-4 border-y border-gray-200">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <span className="font-semibold">Friday, May 16, 2026</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Clock className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <span className="font-semibold">3:00 PM Start • Open to the Public</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <a href="https://walterstudios.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">The Walter Studio, Phoenix, AZ</a>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Gift className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <span className="font-semibold">Sponsored by <a href="https://phoenixchildrens.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Phoenix Children's Hospital</a></span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Gift className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <span className="font-semibold">Presented by <a href="https://lucidmotors.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lucid Motors</a></span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Gift className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <span className="font-semibold">Benefiting <a href="https://www.gatewaycc.edu/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Gateway Community College Nursing Program</a></span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>500 free tickets</strong> for registered nurses — first come, first served. <strong>Public tickets available at the door based on availability.</strong>
                  </p>
                  <Button asChild className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold">
                    <Link href="/phoenix-register">
                      Nurses, Get Your Free Ticket!
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Artists & Performers - Complete Lineup */}
          <div className="border border-gray-200 rounded-lg bg-white shadow-md p-6">
            <h4 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Music className="h-6 w-6 text-red-500" />
              Featuring
            </h4>

            {/* Lineup in fixed display order */}
            <div className="space-y-5">
              <div>
                <h5 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Live Bands</h5>
                <div className="space-y-3">
                  {bandLineup.map((artist, index) => (
                    <div key={artist.name} className="flex items-center gap-3 pb-3 border-b border-gray-200 last:border-b-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <a
                        href={artist.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-700 hover:text-red-600 font-medium transition-colors flex-grow"
                      >
                        <span className="text-lg">♪</span>
                        <span className="hover:underline">{artist.name}</span>
                      </a>
                      {index === 0 && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">Headliner</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">MCs</h5>
                <div className="space-y-3">
                  {djLineup.map((artist, index) => (
                    <div key={artist.name} className="flex items-center gap-3 pb-3 border-b border-gray-200 last:border-b-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <a
                        href={artist.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-700 hover:text-purple-700 font-medium transition-colors flex-grow"
                      >
                        <span className="text-lg">🎧</span>
                        <span className="hover:underline">{artist.name}</span>
                      </a>
                      {index === 0 && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">MC</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Spotify Playlist Embed */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
              <div className="mb-4">
                <h5 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <span className="text-xl">🎵</span>
                  Stream the Lineup on Spotify
                </h5>
                <p className="text-sm text-gray-600 mb-4">
                  Preview all the artists performing at Nursing Rocks Phoenix 2026.{" "}
                  <span className="italic text-gray-500">(Available where Spotify is accessible in your region)</span>
                </p>
              </div>
              <iframe
                src="https://open.spotify.com/embed/playlist/601PiIjcLk4ot4KCj4CDKA?utm_source=generator"
                width="100%"
                height="152"
                frameBorder="0"
                allowFullScreen={true}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style={{ borderRadius: "12px" }}
                title="Nursing Rocks Phoenix 2026 Playlist"
              />
              <p className="text-xs text-gray-500 mt-3 text-center">
                💡 Tip: Free Spotify account available at{" "}
                <a href="https://www.spotify.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  spotify.com
                </a>
              </p>
            </div>
          </div>

          {/* Event Benefits */}
          <div className="border border-purple-200 rounded-lg bg-purple-50 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <Gift className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h5 className="font-bold text-purple-900 mb-1">Benefiting Gateway Community College Scholarships</h5>
                <p className="text-purple-800 text-sm">
                  100% of proceeds support nursing education and healthcare workforce development.
                </p>
              </div>
            </div>
          </div>

          {/* Dallas Coming Soon */}
          <div className="border border-amber-200 rounded-lg p-6 bg-amber-50 shadow-sm">
            <div className="text-center">
              <h4 className="text-xl font-bold text-amber-900 mb-2 flex items-center justify-center gap-2">
                <span>🎸</span>
                Dallas, TX Coming Soon!
              </h4>
              <p className="text-amber-800">
                Nursing Rocks is expanding! Stay tuned for announcements about our Dallas event. Sign up for updates to be first to know.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedArtist;
