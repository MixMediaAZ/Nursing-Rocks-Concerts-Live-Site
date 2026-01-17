import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface WallpaperImage {
  id: number;
  image_url: string;
}

// Static list of city background images from public/assets/city_backgrounds
// Updated to match actual files in public/assets/city_backgrounds (47 files)
const CITY_BACKGROUND_IMAGES: WallpaperImage[] = [
  { id: 1, image_url: '/assets/city_backgrounds/file-1746415252600-107696087.jpeg' },
  { id: 2, image_url: '/assets/city_backgrounds/file-1746415423548-947578775.JPG' },
  { id: 3, image_url: '/assets/city_backgrounds/file-1746415494151-726751177.JPG' },
  { id: 4, image_url: '/assets/city_backgrounds/file-1746415494698-946281521.JPG' },
  { id: 5, image_url: '/assets/city_backgrounds/file-1746415495033-742864723.JPG' },
  { id: 6, image_url: '/assets/city_backgrounds/file-1746415495378-648838152.JPG' },
  { id: 7, image_url: '/assets/city_backgrounds/file-1746415495662-3100884.JPG' },
  { id: 8, image_url: '/assets/city_backgrounds/file-1746415496002-392173619.JPG' },
  { id: 9, image_url: '/assets/city_backgrounds/file-1746415496326-554994931.JPG' },
  { id: 10, image_url: '/assets/city_backgrounds/file-1746415496592-877506142.JPG' },
  { id: 11, image_url: '/assets/city_backgrounds/file-1746415496935-480732093.JPG' },
  { id: 12, image_url: '/assets/city_backgrounds/file-1746415497286-970010446.JPG' },
  { id: 13, image_url: '/assets/city_backgrounds/file-1746415497592-153489308.JPG' },
  { id: 14, image_url: '/assets/city_backgrounds/file-1746415497870-195444575.JPG' },
  { id: 15, image_url: '/assets/city_backgrounds/file-1746415498219-434786734.JPG' },
  { id: 16, image_url: '/assets/city_backgrounds/file-1746415498699-139462888.JPG' },
  { id: 17, image_url: '/assets/city_backgrounds/file-1746415499043-197389304.JPG' },
  { id: 18, image_url: '/assets/city_backgrounds/file-1746415499393-42298688.JPG' },
  { id: 19, image_url: '/assets/city_backgrounds/file-1746415499653-795131558.JPG' },
  { id: 20, image_url: '/assets/city_backgrounds/file-1746415499933-642613458.JPG' },
  { id: 21, image_url: '/assets/city_backgrounds/file-1746415500281-230907837.JPG' },
  { id: 22, image_url: '/assets/city_backgrounds/file-1746415500574-706137558.JPG' },
  { id: 23, image_url: '/assets/city_backgrounds/file-1746415500846-940706670.JPG' },
  { id: 24, image_url: '/assets/city_backgrounds/file-1746415501126-604114040.JPG' },
  { id: 25, image_url: '/assets/city_backgrounds/file-1746415501427-648876285.JPG' },
  { id: 26, image_url: '/assets/city_backgrounds/file-1746415501694-278146563.JPG' },
  { id: 27, image_url: '/assets/city_backgrounds/file-1746415501998-160832737.JPG' },
  { id: 28, image_url: '/assets/city_backgrounds/file-1746415502398-303445833.JPG' },
  { id: 29, image_url: '/assets/city_backgrounds/file-1746415502894-132546696.JPG' },
  { id: 30, image_url: '/assets/city_backgrounds/file-1746415503785-481176626.JPG' },
  { id: 31, image_url: '/assets/city_backgrounds/file-1746415504054-261918199.JPG' },
  { id: 32, image_url: '/assets/city_backgrounds/file-1746415504341-8623508.JPG' },
  { id: 33, image_url: '/assets/city_backgrounds/file-1746415504637-927566847.JPG' },
  { id: 34, image_url: '/assets/city_backgrounds/file-1746415504877-924907924.JPG' },
  { id: 35, image_url: '/assets/city_backgrounds/file-1746415505118-680160008.JPG' },
  { id: 36, image_url: '/assets/city_backgrounds/file-1746415505429-916365463.JPG' },
  { id: 37, image_url: '/assets/city_backgrounds/file-1746415505674-313735018.JPG' },
  { id: 38, image_url: '/assets/city_backgrounds/file-1746415506118-967257178.JPG' },
  { id: 39, image_url: '/assets/city_backgrounds/file-1746415506429-909308709.JPG' },
  { id: 40, image_url: '/assets/city_backgrounds/file-1746415506794-598051849.JPG' },
  { id: 41, image_url: '/assets/city_backgrounds/file-1746415507097-222092305.JPG' },
  { id: 42, image_url: '/assets/city_backgrounds/file-1746415507448-154023948.JPG' },
  { id: 43, image_url: '/assets/city_backgrounds/file-1746415507814-700417122.JPG' },
  { id: 44, image_url: '/assets/city_backgrounds/file-1746415508265-512751471.JPG' },
  { id: 45, image_url: '/assets/city_backgrounds/file-1746415508563-984657263.JPG' },
  { id: 46, image_url: '/assets/city_backgrounds/file-1746415508882-940919466.JPG' },
  { id: 47, image_url: '/assets/city_backgrounds/files-1746415256343-783805015.jpeg' },
];

/**
 * Fisher-Yates shuffle algorithm for random array shuffling
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Individual wallpaper cell that manages its own fade cycle
 * Fades between 75% and 5% opacity over 7 seconds each direction
 * Swaps image at 5% opacity, then fades back up to 75%
 * Rotates through all images in shuffled order before repeating (no redundancy)
 * Only animates when visible in viewport (using Intersection Observer)
 */
function WallpaperCell({ 
  images, 
  initialDelay
}: { 
  images: WallpaperImage[]; 
  initialDelay: number;
}) {
  const [currentImage, setCurrentImage] = useState<WallpaperImage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const controls = useAnimation();
  const cellRef = useRef<HTMLDivElement>(null);
  
  // Create a shuffled rotation of all images for this cell
  // This ensures no redundancy - all images are shown before any repeats
  const shuffledImagesRef = useRef<WallpaperImage[]>([]);
  const currentIndexRef = useRef<number>(0);

  // Initialize shuffled array when images are available
  useEffect(() => {
    if (images.length === 0) return;
    
    // Create a shuffled copy of all images
    shuffledImagesRef.current = shuffleArray(images);
    currentIndexRef.current = 0;
  }, [images]);

  // Get next image from shuffled rotation (no redundancy)
  const getNextImage = useCallback((exclude?: WallpaperImage): WallpaperImage => {
    if (shuffledImagesRef.current.length === 0) {
      shuffledImagesRef.current = shuffleArray(images);
      currentIndexRef.current = 0;
    }
    
    // Get next image from shuffled array
    let nextImage = shuffledImagesRef.current[currentIndexRef.current];
    currentIndexRef.current++;
    
    // If we've gone through all images, reshuffle
    if (currentIndexRef.current >= shuffledImagesRef.current.length) {
      shuffledImagesRef.current = shuffleArray(images);
      currentIndexRef.current = 0;
      
      // Make sure first image of new shuffle isn't same as last image of previous
      if (exclude && shuffledImagesRef.current[0]?.id === exclude.id && shuffledImagesRef.current.length > 1) {
        // Swap first with a random other position
        const swapIdx = 1 + Math.floor(Math.random() * (shuffledImagesRef.current.length - 1));
        [shuffledImagesRef.current[0], shuffledImagesRef.current[swapIdx]] = 
          [shuffledImagesRef.current[swapIdx], shuffledImagesRef.current[0]];
      }
      nextImage = shuffledImagesRef.current[currentIndexRef.current];
      currentIndexRef.current++;
    }
    
    return nextImage;
  }, [images]);

  // Intersection Observer to detect when cell is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
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
    setCurrentImage(getNextImage());

    let isMounted = true;

    const runCycle = async () => {
      if (!isMounted) return;

      // Fade down to 5% opacity (7 seconds)
      await controls.start({ opacity: 0.05 }, { duration: 7, ease: "easeInOut" });

      if (!isMounted) return;

      // Swap to a new image
      setCurrentImage(prev => getNextImage(prev || undefined));

      // Fade up to 75% opacity (7 seconds)
      await controls.start({ opacity: 0.75 }, { duration: 7, ease: "easeInOut" });

      if (!isMounted) return;

      // Continue cycle immediately for smooth continuous animation
      runCycle();
    };

    // Start with initial delay to stagger animations
    const timeoutId = setTimeout(() => {
      controls.set({ opacity: 0.75 });
      runCycle();
    }, initialDelay);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isVisible, images, controls, getNextImage, initialDelay]);

  // Show placeholder until visible
  if (!isVisible) {
    return <div ref={cellRef} className="relative w-full h-full bg-white" />;
  }

  if (!currentImage) return null;

  return (
    <motion.div 
      ref={cellRef}
      className="relative w-full h-full overflow-hidden bg-white"
      animate={controls}
      initial={{ opacity: 0.75 }}
    >
      <img
        src={currentImage.image_url}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          // #region agent log
          fetch('http://127.0.0.1:7256/ingest/99bf51b4-4988-46a2-ac14-c43ca591cfd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/components/wallpaper.tsx:onError',message:'Wallpaper image failed to load',data:{imageUrl:currentImage.image_url,error:'Image load error'},timestamp:Date.now(),sessionId:'debug-session',runId:'wallpaper-debug',hypothesisId:'H1'})}).catch(()=>{});
          // #endregion
          console.error('Wallpaper image failed to load:', currentImage.image_url, e);
        }}
        onLoad={() => {
          // #region agent log
          fetch('http://127.0.0.1:7256/ingest/99bf51b4-4988-46a2-ac14-c43ca591cfd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/components/wallpaper.tsx:onLoad',message:'Wallpaper image loaded successfully',data:{imageUrl:currentImage.image_url},timestamp:Date.now(),sessionId:'debug-session',runId:'wallpaper-debug',hypothesisId:'H1'})}).catch(()=>{});
          // #endregion
        }}
      />
    </motion.div>
  );
}

/**
 * Wallpaper component that creates a dynamic grid of fading images covering the full screen.
 * Each cell independently fades between 75% and 5% opacity over 14 seconds (7s down, 7s up).
 * Images rotate through a shuffled order with no redundancy.
 * White background ensures clean fade transitions.
 */
export function Wallpaper() {
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

  // Generate staggered initial delays for each cell
  // Spread delays across the first ~12 seconds to create natural staggering
  const cellDelays = Array(gridSize).fill(0).map(() => Math.random() * 12000);

  return (
    <div
      className="fixed top-[70px] sm:top-[86px] lg:top-[102px] left-0 right-0 bottom-0 z-[-1] overflow-hidden pointer-events-none bg-white"
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
            images={CITY_BACKGROUND_IMAGES}
            initialDelay={delay}
          />
        ))}
      </div>
    </div>
  );
}
