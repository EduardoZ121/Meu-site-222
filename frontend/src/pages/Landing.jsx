import Navbar from "../components/Navbar";
import Hero from "../sections/Hero";
import QuoteBlock from "../sections/QuoteBlock";
import FeatureSection from "../sections/FeatureSection";
import Pricing from "../sections/Pricing";
import InsideRemakePixel from "../sections/InsideRemakePixel";
import AvailableNow from "../sections/AvailableNow";
import Reviews from "../sections/Reviews";
import FAQ from "../sections/FAQ";
import Policy from "../sections/Policy";
import Founder from "../sections/Founder";
import Marquee from "../sections/Marquee";
import CTAFinal from "../sections/CTAFinal";
import Footer from "../sections/Footer";
import useTitle from "../lib/useTitle";

export default function Landing() {
  useTitle("Remake Pixel — Turn ideas into art in seconds");

  return (
    <div className="relative min-h-screen bg-[#0B0B0C]" data-testid="landing-page">
      <div className="noise-overlay" />
      <Navbar />
      <Hero />
      <QuoteBlock />
      <FeatureSection />
      <Pricing />
      <InsideRemakePixel />
      <AvailableNow />
      <Reviews />
      <FAQ />
      <Policy />
      <Founder />
      <Marquee />
      <CTAFinal />
      <Footer />
    </div>
  );
}
