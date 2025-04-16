import CitySelector from "@/components/city-selector";
import { Helmet } from "react-helmet";

export default function CitiesPage() {
  return (
    <>
      <Helmet>
        <title>Nursing Rocks! Concert Series - Cities & Venues</title>
        <meta name="description" content="Explore Nursing Rocks! Concert Series venues across America. Find concerts in Chicago, New York, Los Angeles, and other major cities celebrating nursing professionals." />
      </Helmet>
      
      <div className="py-8 bg-gradient-to-r from-[#5D3FD3]/5 to-[#FF3366]/5">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Concert Cities</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The Nursing Rocks! Concert Series is touring across America, celebrating nursing professionals in venues nationwide. Find a concert near you.
          </p>
        </div>
      </div>
      
      <CitySelector />
      
      <div className="container py-12">
        <div className="bg-muted rounded-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-4">About Our Concert Series</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="mb-4">
                The Nursing Rocks! Concert Series aims to transform the public perception of nursing by celebrating these essential professionals with the recognition they deserve.
              </p>
              <p className="mb-4">
                Each concert features prominent rock headliners performing in venues nationwide, with special program elements dedicated to honoring local nursing heroes.
              </p>
              <p>
                What makes our concerts truly special is that they're free for registered nurses, with tickets provided by our generous sponsors who believe in our mission.
              </p>
            </div>
            <div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                  <div>
                    <span className="font-medium">Celebrating Nursing Professionals</span>
                    <p className="text-sm text-muted-foreground">Providing the public appreciation that nursing professionals deserve</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <span className="font-medium">Changing Perceptions</span>
                    <p className="text-sm text-muted-foreground">Moving away from the "martyrdom mantle" that nursing has taken on</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <span className="font-medium">Highlighting Opportunities</span>
                    <p className="text-sm text-muted-foreground">Showcasing the extraordinary career opportunities in nursing for diverse individuals</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
                  <div>
                    <span className="font-medium">Supporting Education</span>
                    <p className="text-sm text-muted-foreground">Raising funds for local nursing scholarships in each concert city</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}