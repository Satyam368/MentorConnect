import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

const SessionRequestForm = () => {
  const [formData, setFormData] = useState({
    student: "",
    topic: "",
    preferredTime: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student || !formData.topic || !formData.preferredTime || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mentor/session-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          avatar: "👨‍💻", // Default avatar
          status: "pending"
        })
      });

      if (response.ok) {
        toast({
          title: "Request Sent!",
          description: "Your session request has been sent to the mentor."
        });
        
        // Reset form
        setFormData({
          student: "",
          topic: "",
          preferredTime: "",
          message: ""
        });
      } else {
        throw new Error('Failed to send request');
      }
    } catch (error) {
      console.error('Error sending session request:', error);
      toast({
        title: "Error",
        description: "Failed to send session request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Request a Mentoring Session</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="student">Your Name</Label>
              <Input
                id="student"
                name="student"
                value={formData.student}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <Label htmlFor="topic">Session Topic</Label>
              <Input
                id="topic"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                placeholder="e.g., React Performance Optimization"
                required
              />
            </div>

            <div>
              <Label htmlFor="preferredTime">Preferred Time</Label>
              <Input
                id="preferredTime"
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleChange}
                placeholder="e.g., Dec 26, 2:00 PM"
                required
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Briefly describe what you'd like help with..."
                rows={4}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending Request..." : "Send Session Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionRequestForm;