import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getFileExtension } from '@/lib/assetLoader';

interface DocumentDisplayProps {
  src: string;
  title?: string;
  description?: string;
  className?: string;
  inline?: boolean;
  onError?: () => void;
}

/**
 * A component for displaying and embedding document files like PDFs
 */
export function DocumentDisplay({
  src,
  title,
  description,
  className = '',
  inline = true,
  onError,
}: DocumentDisplayProps) {
  const [error, setError] = useState<boolean>(false);
  
  const fileExtension = getFileExtension(src);
  const isPdf = fileExtension === '.pdf';
  
  const handleError = () => {
    setError(true);
    if (onError) onError();
  };

  // Error state component
  if (error) {
    return (
      <div className={`bg-muted/30 border border-muted-foreground/20 rounded-md p-4 text-center ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-muted-foreground/70" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="mt-2 text-sm text-muted-foreground">Failed to load document</p>
      </div>
    );
  }

  // For PDF files that should be displayed inline
  if (isPdf && inline) {
    return (
      <div className={`flex flex-col ${className}`}>
        {(title || description) && (
          <div className="mb-4">
            {title && <h3 className="font-medium text-lg">{title}</h3>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        )}
        
        <div className="w-full rounded-md overflow-hidden border shadow-sm">
          <iframe
            src={`${src}#toolbar=0&navpanes=0`}
            className="w-full min-h-[500px]"
            onError={handleError}
            title={title || "Document viewer"}
          />
        </div>
      </div>
    );
  }

  // For all other document types or when not displaying inline
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="p-4 border rounded-md">
        <div className="flex items-start gap-4">
          {/* Document Icon */}
          <div className="bg-primary/10 rounded-md p-3">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-primary" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          </div>
          
          {/* Document Info */}
          <div className="flex-grow">
            <h3 className="font-medium">{title || src.split('/').pop()}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            
            <div className="flex flex-wrap gap-2 mt-3">
              <Button asChild size="sm" variant="outline">
                <a 
                  href={src} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download
                </a>
              </Button>
              
              {isPdf && (
                <Button asChild size="sm" variant="ghost">
                  <a 
                    href={src} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    View PDF
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}