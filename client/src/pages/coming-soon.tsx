import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Clock, ArrowLeft } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export default function ComingSoonPage({ title, description }: ComingSoonProps) {
  return (
    <>
      <Helmet>
        <title>{title} - Coming Soon | Nursing Rocks</title>
      </Helmet>
      <div className="container mx-auto px-4 py-16 min-h-[60vh] flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <Clock className="h-20 w-20 mx-auto text-primary mb-6 animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
            <p className="text-xl text-muted-foreground mb-2">
              Coming Soon
            </p>
            {description && (
              <p className="text-muted-foreground mt-4">
                {description}
              </p>
            )}
          </div>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
