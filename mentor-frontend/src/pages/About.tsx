import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Target, Heart, Zap, Award, Globe } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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
        
        // Fetch mentors and students data
        const [mentorsResponse, studentsResponse] = await Promise.all([
          fetch(API_ENDPOINTS.MENTORS),
          fetch(API_ENDPOINTS.STUDENTS)
        ]);

        if (mentorsResponse.ok && studentsResponse.ok) {
          const mentors = await mentorsResponse.json();
          const students = await studentsResponse.json();

          // Calculate real stats
          const totalMentors = Array.isArray(mentors) ? mentors.length : 0;
          const totalStudents = Array.isArray(students) ? students.length : 0;
          
          // Calculate total sessions and average rating from mentors
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

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="hero-section py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            About
            <br />
            <span className="text-primary-glow">Mentor Connect</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 leading-relaxed">
            We're on a mission to democratize access to quality mentorship, 
            connecting ambitious students with industry experts worldwide.
          </p>
          <Link to="/register">
            <Button 
              variant="hero" 
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              Join Our Community
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section - Only for registered users */}
      {isLoggedIn && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-primary to-secondary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {stats.totalStudents.toLocaleString()}+
                  </div>
                  <div className="text-muted-foreground">Students</div>
                </div>
                
                <div className="text-center">
                  <div className="bg-gradient-to-r from-primary to-secondary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Award className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {stats.totalMentors.toLocaleString()}+
                  </div>
                  <div className="text-muted-foreground">Expert Mentors</div>
                </div>
                
                <div className="text-center">
                  <div className="bg-gradient-to-r from-primary to-secondary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Globe className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {stats.totalSessions.toLocaleString()}+
                  </div>
                  <div className="text-muted-foreground">Total Sessions</div>
                </div>
                
                <div className="text-center">
                  <div className="bg-gradient-to-r from-primary to-secondary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Target className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-muted-foreground">Average Rating</div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We believe that everyone deserves access to quality mentorship, regardless of their 
              background or location. Our platform breaks down traditional barriers and creates 
              meaningful connections that accelerate personal and professional growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="text-xl">The Problem</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Many talented students struggle to find the right guidance and industry connections 
                  needed to succeed in their careers. Traditional mentorship programs are often 
                  limited by geography, network size, and accessibility.
                </p>
              </CardContent>
            </Card>

            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="text-xl">Our Solution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Mentor Connect leverages technology to create a global marketplace of knowledge, 
                  where students can easily find and connect with industry experts who are 
                  passionate about sharing their expertise and helping the next generation succeed.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              These core principles guide everything we do at Mentor Connect
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="mentor-card group">
                <CardHeader>
                  <div className="bg-gradient-to-r from-primary to-secondary p-3 rounded-lg w-fit mb-4 group-hover:shadow-glow transition-all duration-300">
                    <value.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isLoggedIn && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Join our growing community of students and mentors
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button variant="hero" size="lg">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default About;