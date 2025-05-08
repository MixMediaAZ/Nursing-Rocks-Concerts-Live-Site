import HeroSection from "@/components/hero-section";
import FeaturedArtist from "@/components/featured-artist";
import ConcertCalendar from "@/components/concert-calendar";
import Newsletter from "@/components/newsletter";
import FeaturedTshirt from "@/components/featured-tshirt";
import { Helmet } from "react-helmet";

const Home = () => {
  return (
    <>
      <Helmet>
        <title>Nursing Rocks! - Concert Series Celebrating Healthcare Heroes</title>
        <meta name="description" content="Experience the magic of live music with Nursing Rocks! Concert Series. Browse upcoming concerts celebrating healthcare heroes, discover artists, and book tickets to your favorite shows." />
      </Helmet>
      
      <HeroSection />
      <FeaturedTshirt />
      <FeaturedArtist />
      <ConcertCalendar />
      <Newsletter />
    </>
  );
};

export default Home;
