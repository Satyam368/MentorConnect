import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Star, Calendar, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api";

const FindMentors = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [mentors, setMentors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load mentors from API
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
        setIsLoading(false);
      }
    };

    fetchMentors();
  }, [toast]);

  // Extract unique domains and locations from mentors
  const domains = ["all", ...new Set(mentors.map(m => m.company || m.mentor?.domain).filter(Boolean))];
  const locations = ["all", ...new Set(mentors.map(m => m.location).filter(Boolean))];
  const languages = ["all", "English", "Spanish", "French", "Mandarin"];

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mentor.company || mentor.mentor?.domain || '')?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mentor.skills || []).some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDomain = selectedDomain === "all" || mentor.company === selectedDomain || mentor.mentor?.domain === selectedDomain;
    const matchesLocation = selectedLocation === "all" || mentor.location === selectedLocation;
    const matchesLanguage = selectedLanguage === "all" || (mentor.languages || []).includes(selectedLanguage);

    return matchesSearch && matchesDomain && matchesLocation && matchesLanguage;
  });

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex-1">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading mentors...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="bg-muted/30 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
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
            <Card key={mentor._id} className="mentor-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {getInitials(mentor.name)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{mentor.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{mentor.company || mentor.mentor?.domain || 'Mentor'}</p>
                    </div>
                  </div>
                  <Badge
                    variant={mentor.isActive ? "default" : "secondary"}
                    className={mentor.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                  >
                    {mentor.isActive ? "Available" : "Busy"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {mentor.bio || 'Experienced professional ready to help you grow.'}
                </p>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{mentor.location || 'Remote'}</span>
                  </div>
                  {mentor.mentor?.averageRating > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{mentor.mentor.averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{mentor.mentor?.experience || 'Experienced'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{mentor.mentor?.totalSessions || 0} sessions</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(mentor.skills || []).slice(0, 3).map((skill: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {(mentor.skills || []).length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{mentor.skills.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="hero"
                    className="flex-1"
                    onClick={() => {
                      const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
                      if (!userData) {
                        toast({
                          title: "Error",
                          description: "Please login to request a session",
                          variant: "destructive"
                        });
                        return;
                      }
                      // Navigate to booking page with mentor ID
                      navigate(`/booking?mentorId=${mentor._id}`);
                    }}
                  >
                    Request Session
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={async () => {
                      const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
                      if (!userData) {
                        toast({
                          title: "Error",
                          description: "Please login to send messages",
                          variant: "destructive"
                        });
                        return;
                      }

                      const user = JSON.parse(userData);

                      // Save current page for back navigation
                      localStorage.setItem('previousPage', '/mentors');

                      // Check if already approved or send request
                      try {
                        const permissionResponse = await fetch(
                          API_ENDPOINTS.CHAT_PERMISSION_CHECK(user.email, mentor.email)
                        );
                        const permissionData = await permissionResponse.json();

                        if (permissionData.canChat) {
                          navigate(`/chat/${mentor.email}`);
                        } else {
                          // Send chat request
                          const response = await fetch(API_ENDPOINTS.CHAT_REQUEST_CREATE, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              sender: user.email,
                              receiver: mentor.email,
                              message: `Hi ${mentor.name}, I would like to connect with you.`
                            })
                          });

                          const data = await response.json();

                          if (data.canChat) {
                            navigate(`/chat/${mentor.email}`);
                          } else {
                            toast({
                              title: data.request.status === 'pending' ? "Request Pending" : "Request Sent",
                              description: data.message,
                            });
                          }
                        }
                      } catch (error) {
                        console.error('Error:', error);
                        toast({
                          title: "Error",
                          description: "Failed to send chat request",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
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
    </div>
  );
};

export default FindMentors;