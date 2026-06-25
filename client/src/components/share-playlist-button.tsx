import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { radioShareUrl, type RadioPlaylist } from "@/lib/nursing-rocks-radio";

interface SharePlaylistButtonProps {
  playlist: RadioPlaylist;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "secondary" | "outline" | "ghost";
}

/**
 * Shares an on-site deep link to a playlist. Prefers the native share sheet
 * (Web Share API, common on mobile); falls back to copying the link with a
 * toast on browsers without it.
 */
export function SharePlaylistButton({
  playlist,
  size = "sm",
  variant = "outline",
}: SharePlaylistButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = radioShareUrl(playlist.playlistId);
    const shareData: ShareData = {
      title: `Nursing Rocks Radio — ${playlist.title}`,
      text: `Listen to "${playlist.title}" on Nursing Rocks Radio.`,
      url,
    };

    // Native share sheet (mostly mobile).
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      (typeof navigator.canShare !== "function" || navigator.canShare(shareData))
    ) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User dismissed the share sheet — not an error, just stop.
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Anything else: fall through to the copy fallback.
      }
    }

    // Fallback: copy link to clipboard.
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied!",
        description: "Share it anywhere — it opens this playlist on Nursing Rocks Radio.",
      });
    } catch {
      toast({
        title: "Couldn't copy the link",
        description: url,
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleShare}
      aria-label={`Share ${playlist.title}`}
    >
      {copied ? (
        <>
          <Check className="mr-1 h-4 w-4" /> Copied
        </>
      ) : (
        <>
          <Share2 className="mr-1 h-4 w-4" /> Share
        </>
      )}
    </Button>
  );
}
