import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface GalleryImage {
  id: number;
  image_url: string;
  thumbnail_url: string | null;
}

/**
 * Individual wallpaper cell that manages its own fade cycle
 * Fades between 75% and 5% opacity, swaps image at 5%, then fades back up
 * Only animates when visible in viewport (using Intersection Observer)
 */
function WallpaperCell({ 
  images, 
  initialDelay 
}: { 
  images: GalleryImage[]; 
  initialDelay: number;
}) {
  const [currentImage, setCurrentImage] = useState<GalleryImage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const controls = useAnimation();
  const cellRef = useRef<HTMLDivElement>(null);

  // Pick a random image, optionally excluding the current one
  const pickRandomImage = useCallback((exclude?: GalleryImage) => {
    if (images.length === 0) return null;
    if (images.length === 1) return images[0];
    
    let newImage: GalleryImage;
    do {
      newImage = images[Math.floor(Math.random() * images.length)];
    } while (exclude && newImage.id === exclude.id && images.length > 1);
    
    return newImage;
  }, [images]);

  // Intersection Observer to detect when cell is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Once visible, no need to observe anymore
        }
      },
      { threshold: 0.1, rootMargin: '50px' } // Start loading slightly before visible
    );
    
    if (cellRef.current) {
      observer.observe(cellRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  // Animation cycle - only runs when cell is visible
  useEffect(() => {
    if (!isVisible || images.length === 0) return;

    // Set initial image
    setCurrentImage(pickRandomImage());

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const runCycle = async () => {
      if (!isMounted) return;

      // Fade out to 5% opacity (1.5 seconds)
      await controls.start({ opacity: 0.05 }, { duration: 1.5, ease: "easeInOut" });
      
      if (!isMounted) return;

      // Swap to a new image
      setCurrentImage(prev => pickRandomImage(prev || undefined));
      
      // Fade back in to 75% opacity (1.5 seconds)
      await controls.start({ opacity: 0.75 }, { duration: 1.5, ease: "easeInOut" });
      
      if (!isMounted) return;

      // Wait random time before next cycle (6-12 seconds)
      // This timing ensures ~25% of cells are transitioning at any time
      const waitTime = 6000 + Math.random() * 6000;
      timeoutId = setTimeout(runCycle, waitTime);
    };

    // Start with initial delay to stagger animations
    timeoutId = setTimeout(() => {
      controls.set({ opacity: 0.75 });
      runCycle();
    }, initialDelay);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isVisible, images, controls, pickRandomImage, initialDelay]);

  // Show placeholder until visible
  if (!isVisible) {
    return <div ref={cellRef} className="relative w-full h-full" />;
  }

  if (!currentImage) return null;

  return (
    <motion.div 
      ref={cellRef}
      className="relative w-full h-full overflow-hidden"
      animate={controls}
      initial={{ opacity: 0.75 }}
    >
      <img
        src={currentImage.thumbnail_url || currentImage.image_url || ''}
        alt=""
        className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)] object-contain"
        loading="lazy"
        decoding="async"
      />
    </motion.div>
  );
}

/**
 * Wallpaper component that creates a dynamic grid of fading images covering the full screen.
 * Each cell independently fades between 75% and 5% opacity, switching images at the low point.
 * Approximately 25% of cells are in transition at any given time.
 * Performance optimized: fewer cells on mobile, intersection observer, thumbnail images
 */
export function Wallpaper() {
  const [allImages, setAllImages] = useState<GalleryImage[]>([]);
  
  // Responsive grid size: fewer cells on mobile for better performance
  const getGridSize = () => {
    if (typeof window === 'undefined') return 60;
    const width = window.innerWidth;
    if (width < 768) return 20;  // Mobile: 20 cells
    if (width < 1024) return 40; // Tablet: 40 cells
    return 60;                   // Desktop: 60 cells
  };
  
  const [gridSize, setGridSize] = useState(getGridSize());

  // Update grid size on window resize
  useEffect(() => {
    const handleResize = () => {
      setGridSize(getGridSize());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch all gallery images once
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/gallery');
        if (!response.ok) return;
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          // Filter for original images only
          const originals = data.filter((img: any) => {
            const url = img.image_url || img.thumbnail_url || '';
            const filename = url.split('/').pop() || '';
            return url && 
                   !filename.includes('-small.') && 
                   !filename.includes('-medium.') && 
                   !filename.includes('-large.') && 
                   !filename.includes('-thumbnail.');
          });
          
          if (originals.length > 0) {
            setAllImages(originals);
          }
        }
      } catch (error) {
        console.error('Error fetching wallpaper images:', error);
      }
    };
    fetchImages();
  }, []);

  // Remove the old style injection if it exists
  useEffect(() => {
    const styleElement = document.getElementById('wallpaper-style');
    if (styleElement) {
      styleElement.remove();
    }
  }, []);

  if (allImages.length === 0) return null;

  // Generate staggered initial delays for each cell
  // Spread delays across the first ~12 seconds to create natural staggering
  const cellDelays = Array(gridSize).fill(0).map(() => Math.random() * 12000);

  return (
    <div
      className="fixed top-[70px] sm:top-[86px] lg:top-[102px] left-0 right-0 bottom-0 z-[-1] overflow-hidden pointer-events-none"
      style={{ backgroundColor: "rgba(200, 180, 255, 0.33)" }}
    >
      <div 
        className="w-full h-full"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gridAutoRows: 'minmax(280px, 1fr)', 
          gap: '4px',
          padding: '4px',
        }}
      >
        {cellDelays.map((delay, index) => (
          <WallpaperCell 
            key={`cell-${index}-${gridSize}`}
            images={allImages}
            initialDelay={delay}
          />
        ))}
      </div>
    </div>
  );
}
