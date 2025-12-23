import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, BookOpen, Star, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import uiFrame from "../assets/ui-frame-v3.png";
import profilePhoto from "../assets/mentor-profile-v3.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>The #1 Mentorship Platform</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
              Master Your Craft with <br />
              <span className="text-gradient">Expert Mentors</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Connect with industry leaders, accelerate your growth, and unlock your full potential through personalized 1-on-1 mentorship.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/25 transition-all duration-300"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/mentors">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-lg h-12 px-8 rounded-xl border-2 hover:bg-secondary/5 transition-all duration-300"
                >
                  Browse Mentors
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border/50">
              <div>
                <div className="text-3xl font-bold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground">Active Mentors</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">1k+</div>
                <div className="text-sm text-muted-foreground">Sessions Done</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">4.9</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </div>
            </div>
          </motion.div>

          {/* Hero Visual/Image */}
          {/* Hero Visual/Image */}
          {/* Hero Visual/Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 glass-card p-6 rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="relative rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/5 to-secondary/5 group aspect-[4/3]">
                <img
                  src={profilePhoto}
                  alt="Master Your Craft"
                  className="w-full h-full object-cover"
                />

                {/* Floating Cards */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute top-10 right-10 glass p-4 rounded-xl flex items-center gap-3 shadow-xl backdrop-blur-md bg-white/80 dark:bg-black/60"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Top Rated</div>
                    <div className="text-xs text-muted-foreground">Mentors</div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-10 left-10 glass p-4 rounded-xl flex items-center gap-3 shadow-xl backdrop-blur-md bg-white/80 dark:bg-black/60"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">100+ Skills</div>
                    <div className="text-xs text-muted-foreground">Available</div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Decorative blobs behind the card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-full blur-3xl -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;