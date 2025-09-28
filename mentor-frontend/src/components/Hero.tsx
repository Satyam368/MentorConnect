import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, BookOpen, Star } from "lucide-react";

const Hero = () => {
  return (
    <section className="hero-section py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
            Connecting Students
            <br />
            <span className="text-primary-glow">with Mentors</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-primary-foreground/90 leading-relaxed">
            Bridge the gap between learning and real-world expertise. Connect with industry professionals who can guide your journey to success.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/register">
              <Button 
                variant="hero" 
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                Join Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/mentors">
              <Button 
                variant="hero" 
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Browse Mentors
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="bg-primary-foreground/10 p-4 rounded-full mb-3">
                <Users className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="text-3xl font-bold text-primary-foreground">500+</div>
              <div className="text-primary-foreground/80">Active Mentors</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-primary-foreground/10 p-4 rounded-full mb-3">
                <BookOpen className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="text-3xl font-bold text-primary-foreground">1000+</div>
              <div className="text-primary-foreground/80">Sessions Completed</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-primary-foreground/10 p-4 rounded-full mb-3">
                <Star className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="text-3xl font-bold text-primary-foreground">4.9</div>
              <div className="text-primary-foreground/80">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;