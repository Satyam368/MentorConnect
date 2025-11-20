import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
import { API_ENDPOINTS } from "@/lib/api";

const Booking = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [sessionDuration, setSessionDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [mentors, setMentors] = useState<any[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [isLoadingMentors, setIsLoadingMentors] = useState(true);

  // Fetch mentors on component mount
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.MENTORS);
        if (response.ok) {
          const data = await response.json();
          setMentors(data.mentors || []);
        } else {
          throw new Error('Failed to fetch mentors');
        }
      } catch (error) {
        console.error('Error fetching mentors:', error);
        toast({
          title: "Error",
          description: "Failed to load mentors. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingMentors(false);
      }
    };

    fetchMentors();
  }, [toast]);

  // Auto-select mentor from URL parameter
  useEffect(() => {
    const mentorId = searchParams.get('mentorId');
    if (mentorId && mentors.length > 0 && !selectedMentor) {
      const mentor = mentors.find(m => m._id === mentorId);
      if (mentor) {
        setSelectedMentor(mentor);
        toast({
          title: "Mentor Selected",
          description: `Booking session with ${mentor.name}`,
        });
      }
    }
  }, [searchParams, mentors, selectedMentor, toast]);

  // Clear selected time when date changes
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(""); // Reset time when date changes
  };

  // Generate available time slots for the selected date based on mentor availability
  const generateTimeSlots = (date: Date | undefined) => {
    if (!date || !selectedMentor) return [];
    
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const currentHour = today.getHours();
    
    // Get mentor's availability (could be string like "Mon-Fri 9am-5pm" or array)
    const mentorAvailability = selectedMentor.mentor?.availability || selectedMentor.availability || "Mon-Fri 9am-5pm";
    
    // Parse mentor availability and generate slots
    let availableSlots: string[] = [];
    
    // If availability is in array format (e.g., ["Monday", "Tuesday", "Wednesday"])
    if (Array.isArray(mentorAvailability)) {
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const currentDay = daysOfWeek[dayOfWeek];
      
      if (mentorAvailability.includes(currentDay)) {
        availableSlots = [
          "09:00", "10:00", "11:00", "12:00", 
          "13:00", "14:00", "15:00", "16:00", "17:00"
        ];
      }
    } else {
      // Default availability logic if string or undefined
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

  const getAvailableSlots = (date: Date | undefined) => {
    return generateTimeSlots(date);
  };

  const handleBooking = async () => {
    // Validate required fields
    if (!selectedMentor) {
      toast({
        title: "Please select a mentor",
        description: "Choose a mentor to book a session with.",
        variant: "destructive",
      });
      return;
    }

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

    // Calculate session cost based on mentor's hourly rate
    const hourlyRate = parseInt(selectedMentor.mentor?.hourlyRate || selectedMentor.hourlyRate || "100");
    const costMultiplier = sessionDuration === "30min" ? 0.5 : 
                          sessionDuration === "45min" ? 0.75 :
                          sessionDuration === "60min" ? 1 :
                          sessionDuration === "90min" ? 1.5 :
                          sessionDuration === "120min" ? 2 : 1;
    
    const sessionCost = Math.round(hourlyRate * costMultiplier);

    try {
      // Get logged-in user from localStorage
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      
      const res = await fetch(API_ENDPOINTS.BOOKINGS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authUser.id || "guest",
          mentorId: selectedMentor._id,
          mentorName: selectedMentor.name,
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
        description: `Your ${sessionDuration} ${sessionType.replace('-', ' ')} on ${selectedDate.toLocaleDateString()} at ${selectedTime} has been requested. Cost: $${sessionCost}`,
      });

      // Reset form
      setSelectedMentor(null);
      setSelectedTime("");
      setSessionType("");
      setSessionDuration("");
      setNotes("");
      
      // Navigate to requests page
      setTimeout(() => {
        navigate('/requests');
      }, 1500);
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
            {/* Booking Details */}
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Session Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mentor Selection */}
                <div>
                  <Label>Select Mentor</Label>
                  <Select 
                    value={selectedMentor?._id || ""} 
                    onValueChange={(mentorId) => {
                      const mentor = mentors.find(m => m._id === mentorId);
                      setSelectedMentor(mentor);
                      setSelectedTime(""); // Reset time when mentor changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a mentor" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingMentors ? (
                        <SelectItem value="loading" disabled>
                          Loading mentors...
                        </SelectItem>
                      ) : mentors.length === 0 ? (
                        <SelectItem value="no-mentors" disabled>
                          No mentors available
                        </SelectItem>
                      ) : (
                        mentors.map((mentor) => (
                          <SelectItem key={mentor._id} value={mentor._id}>
                            {mentor.name} - {mentor.company || mentor.mentor?.domain || "General"} (${mentor.mentor?.hourlyRate || mentor.hourlyRate || "100"}/hr)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedMentor && (
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <p className="text-sm">
                        <span className="font-medium">Availability:</span>{" "}
                        {Array.isArray(selectedMentor.mentor?.availability || selectedMentor.availability) 
                          ? (selectedMentor.mentor?.availability || selectedMentor.availability).join(", ")
                          : (selectedMentor.mentor?.availability || selectedMentor.availability || "Mon-Fri 9am-5pm")}
                      </p>
                      {selectedMentor.skills && selectedMentor.skills.length > 0 && (
                        <p className="text-sm mt-1">
                          <span className="font-medium">Skills:</span> {selectedMentor.skills.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>

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
                  <Select 
                    value={selectedTime} 
                    onValueChange={setSelectedTime}
                    disabled={!selectedMentor}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedMentor
                          ? "Select a mentor first"
                          : getAvailableSlots(selectedDate).length === 0 
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
                      ${selectedMentor && sessionDuration ? (
                        Math.round(
                          parseInt(selectedMentor.mentor?.hourlyRate || selectedMentor.hourlyRate || "100") *
                          (sessionDuration === "30min" ? 0.5 : 
                           sessionDuration === "45min" ? 0.75 :
                           sessionDuration === "60min" ? 1 :
                           sessionDuration === "90min" ? 1.5 :
                           sessionDuration === "120min" ? 2 : 0)
                        )
                      ) : 0}
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
                    {selectedMentor 
                      ? `Available times for ${selectedDate?.toLocaleDateString()}:`
                      : "Select a mentor to see available times"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {!selectedMentor ? (
                      <div className="text-center w-full py-4">
                        <p className="text-sm text-muted-foreground">
                          Please select a mentor first to view available time slots
                        </p>
                      </div>
                    ) : getAvailableSlots(selectedDate).map((time) => (
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
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No upcoming sessions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;