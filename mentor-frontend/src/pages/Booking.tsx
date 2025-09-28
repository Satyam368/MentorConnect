import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar as CalendarIcon, Clock, User, Video, MapPin, Star, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Booking = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [sessionDuration, setSessionDuration] = useState("");
  const [notes, setNotes] = useState("");

  // Clear selected time when date changes
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(""); // Reset time when date changes
  };

  // Mock mentor data
  const mentor = {
    name: "Dr. Elena Rodriguez",
    avatar: "👩‍🎨",
    expertise: "UX Design",
    rating: 4.9,
    sessions: 120,
    hourlyRate: 125,
    bio: "Senior UX Designer with 8+ years of experience at top tech companies. Specializing in user research, design systems, and product strategy.",
    skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
  };

  // Generate available time slots for the selected date
  const generateTimeSlots = (date: Date | undefined) => {
    if (!date) return [];
    
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const currentHour = today.getHours();
    
    // Different availability based on day of week
    let availableSlots: string[] = [];
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend - limited availability
      availableSlots = ["10:00", "11:00", "14:00", "15:00"];
    } else {
      // Weekday - full availability
      availableSlots = [
        "09:00", "10:00", "11:00", "12:00", 
        "13:00", "14:00", "15:00", "16:00", "17:00"
      ];
    }
    
    // Filter out past times if it's today
    if (isToday) {
      availableSlots = availableSlots.filter(slot => {
        const slotHour = parseInt(slot.split(':')[0]);
        return slotHour > currentHour + 1; // Need at least 1 hour notice
      });
    }
    
    return availableSlots;
  };

  // Mock upcoming sessions
  const upcomingSessions = [
    {
      id: 1,
      mentor: "Dr. Sarah Johnson",
      date: "Dec 28, 2024",
      time: "2:00 PM",
      duration: "60 min",
      type: "Video Call",
      status: "confirmed",
      avatar: "👩‍💻"
    },
    {
      id: 2,
      mentor: "Marcus Chen",
      date: "Dec 30, 2024",
      time: "10:00 AM",
      duration: "45 min",
      type: "Video Call",
      status: "pending",
      avatar: "👨‍🔬"
    }
  ];

  const getAvailableSlots = (date: Date | undefined) => {
    return generateTimeSlots(date);
  };

  const handleBooking = async () => {
    // Validate required fields
    if (!selectedDate) {
      toast({
        title: "Please select a date",
        description: "Choose a date from the calendar to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTime) {
      toast({
        title: "Please select a time slot",
        description: "Choose an available time slot for your session.",
        variant: "destructive",
      });
      return;
    }

    if (!sessionType) {
      toast({
        title: "Please select session type",
        description: "Choose how you'd like to conduct the session.",
        variant: "destructive",
      });
      return;
    }

    if (!sessionDuration) {
      toast({
        title: "Please select session duration",
        description: "Choose how long you'd like the session to be.",
        variant: "destructive",
      });
      return;
    }

    // Calculate session cost
    const costMultiplier = sessionDuration === "30min" ? 0.5 : 
                          sessionDuration === "45min" ? 0.75 :
                          sessionDuration === "60min" ? 1 :
                          sessionDuration === "90min" ? 1.5 :
                          sessionDuration === "120min" ? 2 : 1;
    
    const sessionCost = Math.round(mentor.hourlyRate * costMultiplier);

    try {
      // Get logged-in user from localStorage
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      
      const res = await fetch("http://localhost:3000/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authUser.id || "guest",
          mentorName: mentor.name,
          sessionType,
          duration: sessionDuration,
          date: selectedDate.toISOString(),
          time: selectedTime,
          notes,
          cost: sessionCost,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Booking failed");

      toast({
        title: "Session booked successfully!",
        description: `Your ${sessionDuration} ${sessionType.replace('-', ' ')} with ${mentor.name} on ${selectedDate.toLocaleDateString()} at ${selectedTime} has been requested. Cost: $${sessionCost}`,
      });

      // Reset form
      setSelectedTime("");
      setSessionType("");
      setSessionDuration("");
      setNotes("");
    } catch (err: any) {
      toast({
        title: "Booking failed",
        description: err.message || "Unable to book session. Please try again.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="flex-1 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Book a Session</h1>
          <p className="text-muted-foreground">Schedule your mentoring sessions and manage your calendar</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Form */}
          <div className="space-y-6">
            {/* Mentor Info */}
            <Card className="mentor-card">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="text-2xl">{mentor.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="flex items-center space-x-2">
                      <span>{mentor.name}</span>
                      <div className="flex items-center space-x-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{mentor.rating}</span>
                      </div>
                    </CardTitle>
                    <p className="text-muted-foreground">{mentor.expertise}</p>
                    <p className="text-lg font-semibold text-foreground">${mentor.hourlyRate}/hour</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{mentor.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {mentor.skills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Session Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Session Type</Label>
                    <Select value={sessionType} onValueChange={setSessionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select session type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video-call">Video Call</SelectItem>
                        <SelectItem value="phone-call">Phone Call</SelectItem>
                        <SelectItem value="in-person">In Person</SelectItem>
                        <SelectItem value="messaging">Messaging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duration</Label>
                    <Select value={sessionDuration} onValueChange={setSessionDuration}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30min">30 minutes</SelectItem>
                        <SelectItem value="45min">45 minutes</SelectItem>
                        <SelectItem value="60min">1 hour</SelectItem>
                        <SelectItem value="90min">1.5 hours</SelectItem>
                        <SelectItem value="120min">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Time Slot</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        getAvailableSlots(selectedDate).length === 0 
                          ? "No available slots for this date" 
                          : "Select available time"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSlots(selectedDate).length === 0 ? (
                        <SelectItem value="no-slots" disabled>
                          No available time slots
                        </SelectItem>
                      ) : (
                        getAvailableSlots(selectedDate).map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Session Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="What would you like to focus on in this session?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-muted-foreground">Session Cost:</span>
                    <span className="text-lg font-semibold">
                      ${sessionDuration === "30min" ? Math.round(mentor.hourlyRate * 0.5) : 
                        sessionDuration === "45min" ? Math.round(mentor.hourlyRate * 0.75) :
                        sessionDuration === "60min" ? mentor.hourlyRate :
                        sessionDuration === "90min" ? Math.round(mentor.hourlyRate * 1.5) :
                        sessionDuration === "120min" ? mentor.hourlyRate * 2 : 0}
                    </span>
                  </div>
                  <Button onClick={handleBooking} className="w-full" size="lg">
                    Book Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar & Upcoming Sessions */}
          <div className="space-y-6">
            {/* Calendar */}
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  className="rounded-md border w-full"
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">
                    Available times for {selectedDate?.toLocaleDateString()}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getAvailableSlots(selectedDate).map((time) => (
                      <Badge 
                        key={time} 
                        variant={selectedTime === time ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => setSelectedTime(time)}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {time}
                      </Badge>
                    ))}
                    {getAvailableSlots(selectedDate).length === 0 && (
                      <div className="text-center w-full py-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          No available slots for this date
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Try selecting a different date or check back later
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{session.avatar}</div>
                      <div>
                        <p className="font-medium text-card-foreground">{session.mentor}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.date} at {session.time} • {session.duration}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant={session.status === "confirmed" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {session.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Video className="h-3 w-3 mr-1" />
                            {session.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs">
                        Reschedule
                      </Button>
                    </div>
                  </div>
                ))}
                {upcomingSessions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No upcoming sessions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;