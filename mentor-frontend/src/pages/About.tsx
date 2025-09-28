import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Users, Target, Heart, Zap, Award, Globe } from "lucide-react";

const About = () => {
  const stats = [
    { value: "10,000+", label: "Students Mentored", icon: Users },
    { value: "500+", label: "Expert Mentors", icon: Award },
    { value: "50+", label: "Countries", icon: Globe },
    { value: "95%", label: "Success Rate", icon: Target }
  ];

  const team = [
    {
      name: "Sarah Chen",
      role: "CEO & Co-Founder", 
      bio: "Former VP of Engineering at Google. Passionate about democratizing access to mentorship.",
      avatar: "👩‍💼"
    },
    {
      name: "Marcus Rodriguez",
      role: "CTO & Co-Founder",
      bio: "Ex-Principal Engineer at Meta. Building the future of online learning platforms.",
      avatar: "👨‍💻"
    },
    {
      name: "Dr. Emily Johnson",
      role: "Head of Community",
      bio: "PhD in Education Technology. Expert in creating meaningful mentor-student connections.",
      avatar: "👩‍🎓"
    },
    {
      name: "David Kim",
      role: "Head of Product",
      bio: "Former Product Lead at Coursera. Focused on creating intuitive learning experiences.",
      avatar: "👨‍🔬"
    }
  ];

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

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-gradient-to-r from-primary to-secondary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <stat.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The passionate individuals working to revolutionize mentorship
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="mentor-card text-center">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-4">{member.avatar}</div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">
                    {member.name}
                  </h3>
                  <Badge variant="outline" className="mb-4">
                    {member.role}
                  </Badge>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Join thousands of students and mentors who are already part of our growing community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="hero" size="lg">
                Become a Student
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="lg">
                Become a Mentor
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;