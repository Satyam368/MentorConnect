import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Target, Heart, Zap, Award, Globe, ArrowRight } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Star, BookOpen } from "lucide-react";
import profilePhoto from "../assets/mentor-profile-v5.jpg";

const About = () => {
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalMentors: 0,
    totalSessions: 0,
    averageRating: 0
  });

  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
      setIsLoggedIn(!!userData);
    };

    const fetchStats = async () => {
      try {
        setIsLoading(true);

        const [mentorsResponse, studentsResponse] = await Promise.all([
          fetch(API_ENDPOINTS.MENTORS),
          fetch(API_ENDPOINTS.STUDENTS)
        ]);

        if (mentorsResponse.ok && studentsResponse.ok) {
          const mentors = await mentorsResponse.json();
          const students = await studentsResponse.json();

          const totalMentors = Array.isArray(mentors) ? mentors.length : 0;
          const totalStudents = Array.isArray(students) ? students.length : 0;

          let totalSessions = 0;
          let totalRatings = 0;
          let ratingCount = 0;

          if (Array.isArray(mentors)) {
            mentors.forEach((mentor: any) => {
              if (mentor.totalSessions) totalSessions += mentor.totalSessions;
              if (mentor.averageRating) {
                totalRatings += mentor.averageRating;
                ratingCount++;
              }
            });
          }

          const averageRating = ratingCount > 0 ? totalRatings / ratingCount : 0;

          setStats({
            totalStudents,
            totalMentors,
            totalSessions,
            averageRating
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    fetchStats();
  }, []);

  const values = [
    {
      icon: Heart,
      title: "Meaningful Connections",
      description: "We believe in fostering genuine relationships between mentors and students that last beyond individual sessions."
    },
    {
      icon: Zap,
      title: "Rapid Growth",
      description: "Our platform is designed to accelerate learning and career development through expert guidance and practical insights."
    },
    {
      icon: Globe,
      title: "Global Community",
      description: "We connect talented individuals across borders, creating a diverse and inclusive learning environment."
    },
    {
      icon: Target,
      title: "Goal-Oriented",
      description: "Every mentorship relationship is structured around clear objectives and measurable outcomes."
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh]">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-7xl font-bold mb-8 tracking-tight leading-tight">
              Empowering the Next Generation of <span className="text-gradient">Leaders</span>
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              We're on a mission to democratize access to quality mentorship,
              connecting ambitious students with industry experts worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button
                  size="lg"
                  className="btn-premium bg-primary text-primary-foreground h-12 px-8 text-lg"
                >
                  Join Our Community
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/mentors">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-lg hover:bg-muted/50"
                >
                  Find a Mentor
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-panel rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl"
          >
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                {[
                  { icon: Users, label: "Students", value: stats.totalStudents, suffix: "+" },
                  { icon: Award, label: "Expert Mentors", value: stats.totalMentors, suffix: "+" },
                  { icon: Globe, label: "Total Sessions", value: stats.totalSessions, suffix: "+" },
                  { icon: Target, label: "Average Rating", value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A", suffix: "" }
                ].map((stat, index) => (
                  <div key={index} className="text-center group">
                    <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <stat.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}{stat.suffix}
                    </div>
                    <div className="text-muted-foreground font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Our Mission</h2>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                We believe that everyone deserves access to quality mentorship, regardless of their
                background or location. Our platform breaks down traditional barriers and creates
                meaningful connections that accelerate personal and professional growth.
              </p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-primary/10 p-3 rounded-xl h-fit">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">The Problem</h3>
                    <p className="text-muted-foreground">
                      Many talented students struggle to find the right guidance and industry connections
                      needed to succeed in their careers.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-secondary/10 p-3 rounded-xl h-fit">
                    <Zap className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Our Solution</h3>
                    <p className="text-muted-foreground">
                      A global marketplace of knowledge where students can easily connect with
                      industry experts passionate about sharing their expertise.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative z-10 glass-card p-4 rotate-3 hover:rotate-0 transition-transform duration-500 max-w-md mx-auto">
                <div className="relative rounded-xl overflow-hidden shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5 group aspect-[4/3]">
                  <img
                    src={profilePhoto}
                    alt="Team collaboration"
                    className="w-full h-full object-cover"
                  />

                  {/* Floating Cards */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="absolute top-6 right-6 glass p-2.5 rounded-lg flex items-center gap-2 shadow-lg backdrop-blur-md bg-white/80 dark:bg-black/60"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <Star className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Top Rated</div>
                      <div className="text-[10px] text-muted-foreground">Mentors</div>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-6 left-6 glass p-2.5 rounded-lg flex items-center gap-2 shadow-lg backdrop-blur-md bg-white/80 dark:bg-black/60"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">100+ Skills</div>
                      <div className="text-[10px] text-muted-foreground">Available</div>
                    </div>
                  </motion.div>
                </div>
              </div>            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-6"
            >
              Our Core <span className="text-gradient">Values</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              These principles guide every decision we make and every interaction we facilitate.
            </motion.p>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {values.map((value, index) => (
              <motion.div key={index} variants={item}>
                <Card className="glass-card border-0 h-full group hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors">
                  <CardHeader className="flex flex-row items-center gap-6 pb-2">
                    <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <value.icon className="h-8 w-8 text-primary group-hover:text-secondary transition-colors" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg text-muted-foreground leading-relaxed pl-[5.5rem]">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      {!isLoggedIn && (
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-12 md:p-20 text-center text-white relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold mb-8">
                  Ready to Start Your Journey?
                </h2>
                <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
                  Join our growing community of students and mentors today and take the first step towards your goals.
                </p>
                <Link to="/register">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-14 px-10 text-lg font-semibold bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
                  >
                    Get Started Now
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

export default About;