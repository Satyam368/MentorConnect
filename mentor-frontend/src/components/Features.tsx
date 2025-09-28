import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MessageCircle, Calendar, Shield, Users, Zap } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Smart Matching",
    description: "Our AI-powered system matches you with mentors based on your goals, interests, and learning style."
  },
  {
    icon: MessageCircle,
    title: "Direct Communication",
    description: "Connect directly with mentors through our secure messaging platform and video calls."
  },
  {
    icon: Calendar,
    title: "Flexible Scheduling",
    description: "Book sessions that fit your schedule with easy-to-use calendar integration."
  },
  {
    icon: Shield,
    title: "Verified Mentors",
    description: "All mentors are thoroughly vetted professionals with proven industry experience."
  },
  {
    icon: Users,
    title: "Community Support",
    description: "Join a supportive community of learners and mentors from around the world."
  },
  {
    icon: Zap,
    title: "Quick Results",
    description: "See immediate progress with structured mentorship programs and goal tracking."
  }
];

const Features = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose Mentor Connect?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the features that make our platform the best choice for your mentorship journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="mentor-card group">
              <CardHeader>
                <div className="bg-gradient-to-r from-primary to-secondary p-3 rounded-lg w-fit group-hover:shadow-glow transition-all duration-300">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl font-semibold text-card-foreground">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;