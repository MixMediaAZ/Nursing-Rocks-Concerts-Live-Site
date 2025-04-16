import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  songTitle: string;
  duration: string;
  audioSrc?: string;
}

const AudioPlayer = ({ songTitle, duration, audioSrc }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio(audioSrc || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    
    // Update time
    audioRef.current.addEventListener('timeupdate', updateProgress);
    
    // When audio ends
    audioRef.current.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime("0:00");
    });
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', updateProgress);
      }
    };
  }, [audioSrc]);
  
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const updateProgress = () => {
    if (audioRef.current) {
      const audio = audioRef.current;
      const progressValue = (audio.currentTime / audio.duration) * 100;
      setProgress(progressValue);
      
      // Format current time
      const minutes = Math.floor(audio.currentTime / 60);
      const seconds = Math.floor(audio.currentTime % 60);
      setCurrentTime(`${minutes}:${seconds < 10 ? '0' + seconds : seconds}`);
    }
  };
  
  const handleSliderChange = (value: number[]) => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      const newTime = (value[0] / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(value[0]);
    }
  };
  
  return (
    <div className="bg-[#333333]/5 p-4 rounded-lg">
      <div className="text-sm font-bold mb-2">Listen to their latest single:</div>
      <div className="flex items-center">
        <Button
          onClick={togglePlayPause}
          variant="default"
          size="icon"
          className="bg-[#5D3FD3] text-white rounded-full w-10 h-10 flex items-center justify-center mr-3 hover:bg-[#5D3FD3]/90"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </Button>
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="text-sm">{songTitle}</span>
            <span className="text-xs text-[#333333]/70">{isPlaying ? currentTime : duration}</span>
          </div>
          <Slider 
            value={[progress]} 
            max={100} 
            step={0.1}
            onValueChange={handleSliderChange}
            className="w-full h-1.5"
          />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
