import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center medical-bg">
      <Card className="medical-card w-full max-w-md mx-4 shadow-md">
        <div className="bg-primary/10 p-3 flex items-center justify-center">
          <div className="p-5 bg-white rounded-full inline-flex shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold text-center mb-2">
            <span className="bg-clip-text text-transparent nurse-gradient">
              Page Not Found (404)
            </span>
          </h1>

          <div className="mt-3 p-4 bg-primary/5 rounded-md border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">Vital Signs Absent</p>
            </div>
            <p className="text-muted-foreground text-sm">
              The page you're looking for doesn't exist or may have been moved to a different location.
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <Link href="/">
              <Button className="rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Return to Home
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 flex justify-center">
            <div className="heartbeat-animation inline-flex items-center text-xs text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Nursing Rocks Concert Series
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
