import HeroSection from "@/components/hero-section";
import UpcomingEvents from "@/components/upcoming-events";
import FeaturedArtist from "@/components/featured-artist";
import ConcertCalendar from "@/components/concert-calendar";
import StableGallery from "@/components/stable-gallery";
import Newsletter from "@/components/newsletter";
import PromotionButtons from "@/components/promotion-buttons";
import { Helmet } from "react-helmet";

const Home = () => {
  return (
    <>
      <Helmet>
        <title>Nursing Rocks! - Concert Series Celebrating Healthcare Heroes</title>
        <meta name="description" content="Experience the magic of live music with Nursing Rocks! Concert Series. Browse upcoming concerts celebrating healthcare heroes, discover artists, and book tickets to your favorite shows." />
      </Helmet>
      
      <HeroSection />
      <PromotionButtons />
      <UpcomingEvents />
      <FeaturedArtist />
      <ConcertCalendar />
      <StableGallery />
      <Newsletter />
    </>
  );
};

export default Home;
