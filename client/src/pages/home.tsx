import HeroSection from "@/components/hero-section";
import FeaturedArtist from "@/components/featured-artist";
import ConcertCalendar from "@/components/concert-calendar";
import Newsletter from "@/components/newsletter";
import PromotionButtons from "@/components/promotion-buttons";
import NursingRocksRadioTeaser from "@/components/nursing-rocks-radio-teaser";
import PhoenixFadeGallery from "@/components/phoenix-fade-gallery";
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
      <NursingRocksRadioTeaser />
      <FeaturedArtist />

      {/* Recent show highlight — fades through all phoenix photos */}
      <PhoenixFadeGallery />

      <ConcertCalendar />
      <Newsletter />
    </>
  );
};

export default Home;
