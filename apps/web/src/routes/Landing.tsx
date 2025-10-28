import { Box } from '@mui/material';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import TestimonialSection from '../components/TestimonialSection';
import CallToAction from '../components/CallToAction';
import Footer from '../components/Footer';
import StatsSection from '../components/StatsSection';
import CoursesSection from '../components/CoursesSection';
import FeaturedExamsSection from '../components/FeaturedExamsSection';

export default function Landing() {
  
  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <StatsSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Courses Section */}
      <CoursesSection />

      {/* Featured Exams Section */}
      <FeaturedExamsSection />

      {/* Testimonials Section */}
      <TestimonialSection />

      {/* Call to Action */}
      <CallToAction />

      {/* Footer */}
      <Footer />
    </Box>
  );
}