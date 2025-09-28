import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Star, Calendar, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Mock mentor data
const mentors = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    domain: "Software Engineering",
    experience: "8 years",
    location: "San Francisco, CA",
    rating: 4.9,
    sessions: 150,
    availability: "Available",
    skills: ["React", "Node.js", "System Design", "Leadership"],
    avatar: "👩‍💻",
    bio: "Senior Software Engineer at Google with expertise in full-stack development and team leadership."
  },
  {
    id: 2,
    name: "Marcus Chen",
    domain: "Data Science",
    experience: "6 years",
    location: "New York, NY",
    rating: 4.8,
    sessions: 98,
    availability: "Available",
    skills: ["Python", "Machine Learning", "Statistics", "SQL"],
    avatar: "👨‍🔬",
    bio: "Data Scientist at Netflix, passionate about AI and helping students break into tech."
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    domain: "UX Design",
    experience: "5 years",
    location: "Austin, TX",
    rating: 4.9,
    sessions: 120,
    availability: "Busy",
    skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
    avatar: "👩‍🎨",
    bio: "Senior UX Designer at Airbnb, focused on creating intuitive user experiences."
  },
  {
    id: 4,
    name: "David Kim",
    domain: "Product Management",
    experience: "7 years",
    location: "Seattle, WA",
    rating: 4.7,
    sessions: 85,
    availability: "Available",
    skills: ["Strategy", "Analytics", "Roadmapping", "Leadership"],
    avatar: "👨‍💼",
    bio: "Product Manager at Microsoft Azure, helping build products used by millions."
  }
];

const FindMentors = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");

  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [requestSessionType, setRequestSessionType] = useState("");
  const [requestDuration, setRequestDuration] = useState("");
  const [requestTime, setRequestTime] = useState("");
  const [requestNotes, setRequestNotes] = useState("");

  const domains = ["all", "Software Engineering", "Data Science", "UX Design", "Product Management"];
  const locations = ["all", "San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA"];
  const languages = ["all", "English", "Spanish", "French", "Mandarin"];

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDomain = selectedDomain === "all" || mentor.domain === selectedDomain;
    const matchesLocation = selectedLocation === "all" || mentor.location === selectedLocation;
    const matchesLanguage = selectedLanguage === "all" || ["English", "Spanish", "French"].includes(selectedLanguage);
    
    return matchesSearch && matchesDomain && matchesLocation && matchesLanguage;
  });

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-4">Find Your Perfect Mentor</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Connect with industry professionals who can guide you on your career journey
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mentors, skills, or domains..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger>
              <SelectValue placeholder="Select Domain" />
            </SelectTrigger>
            <SelectContent>
              {domains.map(domain => (
                <SelectItem key={domain} value={domain}>
                  {domain === "all" ? "All Domains" : domain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Select Location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map(location => (
                <SelectItem key={location} value={location}>
                  {location === "all" ? "All Locations" : location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map(language => (
                <SelectItem key={language} value={language}>
                  {language === "all" ? "All Languages" : language}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map(mentor => (
            <Card key={mentor.id} className="mentor-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{mentor.avatar}</div>
                    <div>
                      <CardTitle className="text-lg">{mentor.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{mentor.domain}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={mentor.availability === "Available" ? "default" : "secondary"}
                    className={mentor.availability === "Available" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                  >
                    {mentor.availability}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {mentor.bio}
                </p>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{mentor.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{mentor.rating}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{mentor.experience} experience</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{mentor.sessions} sessions</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {mentor.skills.slice(0, 3).map(skill => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {mentor.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{mentor.skills.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button 
                    variant="hero" 
                    className="flex-1"
                    disabled={mentor.availability !== "Available"}
                    onClick={() => {
                      setSelectedMentor(mentor);
                      setIsRequestOpen(true);
                    }}
                  >
                    Request Session
                  </Button>
                  <Link to={`/chat/${mentor.id}`}>
                    <Button variant="outline" size="icon">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMentors.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-foreground mb-2">No mentors found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Session Request Modal */}
      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a session</DialogTitle>
            <DialogDescription>
              {selectedMentor ? `With ${selectedMentor.name} • ${selectedMentor.domain}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Session Type</Label>
                <Select value={requestSessionType} onValueChange={setRequestSessionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video-call">Video Call</SelectItem>
                    <SelectItem value="phone-call">Phone Call</SelectItem>
                    <SelectItem value="messaging">Messaging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration</Label>
                <Select value={requestDuration} onValueChange={setRequestDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30min">30 minutes</SelectItem>
                    <SelectItem value="45min">45 minutes</SelectItem>
                    <SelectItem value="60min">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Preferred Time</Label>
              <Select value={requestTime} onValueChange={setRequestTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00">09:00</SelectItem>
                  <SelectItem value="10:00">10:00</SelectItem>
                  <SelectItem value="14:00">14:00</SelectItem>
                  <SelectItem value="15:00">15:00</SelectItem>
                  <SelectItem value="16:00">16:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" rows={3} placeholder="What would you like to focus on?" value={requestNotes} onChange={(e) => setRequestNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!requestSessionType || !requestDuration || !requestTime) {
                  toast({ title: "Missing details", description: "Please select type, duration, and time.", variant: "destructive" });
                  return;
                }
                setIsRequestOpen(false);
                toast({ title: "Request sent!", description: "The mentor will review your request." });
                navigate("/requests");
              }}
              className="w-full"
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FindMentors;