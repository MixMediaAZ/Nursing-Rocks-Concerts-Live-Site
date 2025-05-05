import React from 'react';

interface YouTubeEmbedProps {
  videoId: string;
  className?: string;
  title?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
}

/**
 * YouTube embed component for reliable video playback
 */
export function YouTubeEmbed({
  videoId,
  className = "",
  title = "Nursing Rocks Concert Series",
  autoPlay = true,
  muted = true,
  controls = true,
}: YouTubeEmbedProps) {
  // Build the YouTube embed URL with parameters
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? '1' : '0'}&mute=${muted ? '1' : '0'}&controls=${controls ? '1' : '0'}&rel=0`;

  return (
    <div className={`youtube-container relative overflow-hidden ${className}`} style={{ aspectRatio: '16/9' }}>
      <iframe
        src={embedUrl}
        title={title}
        className="absolute w-full h-full top-0 left-0"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}