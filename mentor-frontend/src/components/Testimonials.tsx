import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Computer Science Student",
    content: "Thanks to my mentor on Mentor Connect, I landed my first internship at a tech company. The guidance was invaluable!",
    rating: 5,
    avatar: "👩‍💻"
  },
  {
    name: "Marcus Johnson",
    role: "Business Student",
    content: "The mentorship program helped me develop crucial leadership skills. My mentor's industry insights were game-changing.",
    rating: 5,
    avatar: "👨‍💼"
  },
  {
    name: "Elena Rodriguez",
    role: "Design Student",
    content: "Working with my mentor not only improved my design skills but also taught me how to navigate the creative industry.",
    rating: 5,
    avatar: "👩‍🎨"
  }
];

const Testimonials = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Students Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real experiences from students who found their perfect mentors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="mentor-card relative">
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-primary mb-4 opacity-50" />
                <p className="text-card-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-semibold text-card-foreground">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;