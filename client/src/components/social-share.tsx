import { useState } from 'react';
import { 
  Twitter, 
  Facebook, 
  Linkedin, 
  Mail, 
  Copy, 
  Share2, 
  Check, 
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from '@/hooks/use-toast';

export interface SocialShareProps {
  title: string;
  description?: string;
  url?: string;
  hashtags?: string[];
  compact?: boolean;
  className?: string;
}

export function SocialShare({
  title,
  description = '',
  url = window.location.href,
  hashtags = ['NursingRocks', 'ConcertSeries'],
  compact = false,
  className = '',
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { toast } = useToast();

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedHashtags = hashtags.join(',');

  const shareText = `${title}${description ? ` - ${description}` : ''}`;
  const encodedShareText = encodeURIComponent(shareText);

  // Social media share URLs
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedShareText}&url=${encodedUrl}&hashtags=${encodedHashtags}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedShareText}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const mailtoUrl = `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true);
        toast({
          title: "Link copied to clipboard",
          description: "You can now share it with anyone",
        });
        
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
        toast({
          title: "Failed to copy",
          description: "Please try again",
          variant: "destructive",
        });
      }
    );
  };

  // For mobile devices, use the native share API if available
  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: description,
        url: url,
      })
        .then(() => {
          toast({
            title: "Shared successfully",
          });
        })
        .catch((error) => {
          console.error('Error sharing:', error);
          setShareOpen(true); // Fallback to our custom popover
        });
    } else {
      setShareOpen(true); // Fallback to our custom popover
    }
  };

  // If compact mode is enabled, just show the share button with a popover
  if (compact) {
    return (
      <div className={className}>
        <Popover open={shareOpen} onOpenChange={setShareOpen}>
          <PopoverTrigger asChild>
            <Button 
              onClick={handleNativeShare} 
              size="sm" 
              variant="outline"
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="end">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-9 w-9 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20"
                      onClick={() => window.open(twitterUrl, '_blank')}
                    >
                      <Twitter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share on X (Twitter)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-9 w-9 rounded-full bg-[#4267B2]/10 text-[#4267B2] hover:bg-[#4267B2]/20"
                      onClick={() => window.open(facebookUrl, '_blank')}
                    >
                      <Facebook className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share on Facebook</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-9 w-9 rounded-full bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20"
                      onClick={() => window.open(linkedinUrl, '_blank')}
                    >
                      <Linkedin className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share on LinkedIn</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-9 w-9 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                      onClick={() => window.open(mailtoUrl, '_blank')}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share via Email</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                      onClick={copyToClipboard}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copied ? 'Copied!' : 'Copy Link'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7 rounded-full ml-1"
                onClick={() => setShareOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Full mode with all buttons displayed inline
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-medium mr-1">Share:</span>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-9 w-9 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] hover:bg-[#1DA1F2]/20"
              onClick={() => window.open(twitterUrl, '_blank')}
            >
              <Twitter className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share on X (Twitter)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-9 w-9 rounded-full bg-[#4267B2]/10 text-[#4267B2] hover:bg-[#4267B2]/20"
              onClick={() => window.open(facebookUrl, '_blank')}
            >
              <Facebook className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share on Facebook</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-9 w-9 rounded-full bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20"
              onClick={() => window.open(linkedinUrl, '_blank')}
            >
              <Linkedin className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share on LinkedIn</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-9 w-9 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              onClick={() => window.open(mailtoUrl, '_blank')}
            >
              <Mail className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share via Email</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-9 w-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? 'Copied!' : 'Copy Link'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}