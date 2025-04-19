import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Gift, Award, Sparkles, ArrowRight } from "lucide-react";

export function PromotionsSection() {
  return (
    <div className="py-12 bg-gradient-to-r from-purple-50 to-pink-50 border-y">
      <div className="container">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-1.5 rounded-full bg-primary/10">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Special Promotions & Giveaways</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Nurse Support Giveaway */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="p-2 rounded-full bg-purple-100">
                  <Award className="h-5 w-5 text-purple-600" />
                </span>
                <h3 className="text-xl font-semibold">Nurse Support Giveaway</h3>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Enter for a chance to win a complete Nursing Rocks merchandise package. 
                Every entry provides support to nursing education initiatives.
              </p>
              
              <div className="flex items-center justify-between">
                <Link href="/store/promotion/nurse-support">
                  <Button variant="outline" className="gap-2 group">
                    Learn More
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <div className="text-sm font-medium text-purple-600 flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Limited Time Only
                </div>
              </div>
            </div>
            <div className="h-2 bg-gradient-to-r from-purple-400 to-pink-500"></div>
          </div>
          
          {/* Free Concert Tickets */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="p-2 rounded-full bg-blue-100">
                  <Gift className="h-5 w-5 text-blue-600" />
                </span>
                <h3 className="text-xl font-semibold">Free Concert Tickets</h3>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Licensed nurses can register to receive free tickets to select 
                Nursing Rocks concerts. Verify your nursing license to qualify.
              </p>
              
              <div className="flex items-center justify-between">
                <Link href="/license">
                  <Button variant="outline" className="gap-2 group">
                    Verify License
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <div className="text-sm font-medium text-blue-600 flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  For Verified Nurses
                </div>
              </div>
            </div>
            <div className="h-2 bg-gradient-to-r from-blue-400 to-green-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
}