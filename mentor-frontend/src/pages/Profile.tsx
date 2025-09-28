import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { User, Mail, Phone, MapPin, Clock, Plus, X, Camera, Languages, Award, Briefcase, Target as TargetIcon, BookOpen, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Dynamic user data - loaded from backend
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    role: "student", // default role
    bio: "",
    skills: [] as string[],
    languages: [] as string[],
    experience: "",
    hourlyRate: "",
    availability: [] as string[],
    certifications: [] as string[],
    education: "",
    company: "",
    position: ""
  });

  // Load user data on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // Get user data from localStorage (from login)
        const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
        
        if (!userData) {
          // If no user data in localStorage, redirect to login or show message
          console.log('No user data found in localStorage');
          toast({
            title: "Session Expired",
            description: "Please log in to view your profile",
            variant: "destructive"
          });
          // Optionally redirect to login page
          // window.location.href = '/login';
          setIsLoading(false);
          return;
        }

        const user = JSON.parse(userData);
        
        // Set basic user info from registration
        setProfile(prev => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
          role: user.role || "student"
        }));

        // Try to fetch existing profile data from backend
        if (user.email) {
          try {
            console.log('Fetching profile for email:', user.email);
            const profileResponse = await fetch(`http://localhost:3000/api/profile/${encodeURIComponent(user.email)}`);
            console.log('Profile response status:', profileResponse.status);
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              console.log('Profile data received:', profileData);
              
              // Merge profile data with user data
              setProfile(prev => ({
                ...prev,
                ...profileData.user,
                // Preserve user data from localStorage
                name: user.name || profileData.user.name || "",
                email: user.email || profileData.user.email || "",
                role: user.role || profileData.user.role || "student"
              }));
              console.log('Profile loaded successfully');
            } else {
              const errorText = await profileResponse.text();
              console.log('Profile response error:', errorText);
              console.log('No existing profile found, using user registration data');
            }
          } catch (profileError) {
            console.log('Error fetching profile, using user registration data:', profileError);
          }
        }

      } catch (error) {
        console.error('Error loading user profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try logging in again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [toast]);

  const [newSkill, setNewSkill] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [newAvailabilityDay, setNewAvailabilityDay] = useState("Monday");
  const [newAvailabilityStart, setNewAvailabilityStart] = useState("09:00");
  const [newAvailabilityEnd, setNewAvailabilityEnd] = useState("12:00");
  const [newService, setNewService] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [newFormat, setNewFormat] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newPortfolioLink, setNewPortfolioLink] = useState("");

  // Role-specific state (client-side only)
  const [mentorExtras, setMentorExtras] = useState({
    services: ["Career Guidance", "Interview Prep", "Code Reviews"],
    industries: ["FinTech", "E-commerce"],
    formats: ["Video Call", "Messaging", "Code Pairing"],
  });
  const [menteeExtras, setMenteeExtras] = useState({
    currentLevel: "Junior",
    targetRole: "Full-Stack Developer",
    learningStyle: "Hands-on Projects",
    goals: ["Master React", "Build Portfolio"],
    interests: ["Web Dev", "System Design"],
    portfolioLinks: ["https://github.com/username", "https://portfolio.example.com"],
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Prepare complete profile data
      const profileData = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        role: profile.role,
        bio: profile.bio,
        skills: profile.skills,
        languages: profile.languages,
        experience: profile.experience,
        hourlyRate: profile.hourlyRate,
        availability: profile.availability,
        certifications: profile.certifications,
        education: profile.education,
        company: profile.company,
        position: profile.position,
        // Include role-specific data
        mentorExtras: profile.role === "mentor" ? mentorExtras : undefined,
        menteeExtras: profile.role === "student" ? menteeExtras : undefined
      };

      const response = await fetch('http://localhost:3000/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Profile updated successfully!",
          description: result.message || "Your changes have been saved.",
        });
        
        // Update localStorage with the new user data
        const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          const updatedUser = { ...user, name: profile.name };
          localStorage.setItem('authUser', JSON.stringify(updatedUser));
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim()) {
      setProfile(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage("");
    }
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setProfile(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification("");
    }
  };

  const addAvailability = () => {
    const range = `${newAvailabilityDay} ${newAvailabilityStart}-${newAvailabilityEnd}`;
    setProfile(prev => ({ ...prev, availability: [...prev.availability, range] }));
  };
  const removeAvailability = (slot: string) => {
    setProfile(prev => ({ ...prev, availability: prev.availability.filter(a => a !== slot) }));
  };

  // Mentor extras handlers
  const addService = () => {
    if (newService.trim()) {
      setMentorExtras(prev => ({ ...prev, services: [...prev.services, newService.trim()] }));
      setNewService("");
    }
  };
  const removeService = (s: string) => setMentorExtras(prev => ({ ...prev, services: prev.services.filter(x => x !== s) }));
  const addIndustry = () => {
    if (newIndustry.trim()) {
      setMentorExtras(prev => ({ ...prev, industries: [...prev.industries, newIndustry.trim()] }));
      setNewIndustry("");
    }
  };
  const removeIndustry = (s: string) => setMentorExtras(prev => ({ ...prev, industries: prev.industries.filter(x => x !== s) }));
  const addFormat = () => {
    if (newFormat.trim()) {
      setMentorExtras(prev => ({ ...prev, formats: [...prev.formats, newFormat.trim()] }));
      setNewFormat("");
    }
  };
  const removeFormat = (s: string) => setMentorExtras(prev => ({ ...prev, formats: prev.formats.filter(x => x !== s) }));

  // Mentee extras handlers
  const addGoal = () => {
    if (newGoal.trim()) {
      setMenteeExtras(prev => ({ ...prev, goals: [...prev.goals, newGoal.trim()] }));
      setNewGoal("");
    }
  };
  const removeGoal = (g: string) => setMenteeExtras(prev => ({ ...prev, goals: prev.goals.filter(x => x !== g) }));
  const addInterest = () => {
    if (newInterest.trim()) {
      setMenteeExtras(prev => ({ ...prev, interests: [...prev.interests, newInterest.trim()] }));
      setNewInterest("");
    }
  };
  const removeInterest = (i: string) => setMenteeExtras(prev => ({ ...prev, interests: prev.interests.filter(x => x !== i) }));
  const addPortfolioLink = () => {
    if (newPortfolioLink.trim()) {
      setMenteeExtras(prev => ({ ...prev, portfolioLinks: [...prev.portfolioLinks, newPortfolioLink.trim()] }));
      setNewPortfolioLink("");
    }
  };
  const removePortfolioLink = (l: string) => setMenteeExtras(prev => ({ ...prev, portfolioLinks: prev.portfolioLinks.filter(x => x !== l) }));

  if (isLoading) {
    return (
      <div className="flex-1 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no user data (not logged in)
  if (!profile.name && !profile.email) {
    return (
      <div className="flex-1 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Profile Not Available</h2>
              <p className="text-muted-foreground mb-4">
                No user session found. Please log in to view and edit your profile.
              </p>
              <div className="space-y-2">
                <Button onClick={() => window.location.href = '/login'}>
                  Go to Login
                </Button>
                <div>
                  <Button variant="outline" onClick={() => window.location.href = '/register'}>
                    Create Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile Management</h1>
            <p className="text-muted-foreground">Manage your profile information and settings</p>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Photo & Basic Info */}
          <div className="lg:col-span-1">
            <Card className="mentor-card">
              <CardHeader className="text-center">
                <div className="relative inline-block">
                  <Avatar className="w-32 h-32 mx-auto">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="text-2xl">
                      {profile.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 rounded-full"
                      variant="secondary"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <CardTitle className="mt-4">{profile.name}</CardTitle>
                <Badge variant="secondary" className="mt-2">
                  {profile.role === "mentor" ? "Mentor" : "Mentee"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.location}</span>
                </div>
                {profile.role === "mentor" && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.hourlyRate}/hour</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    disabled={!isEditing}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled={!isEditing}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    disabled={!isEditing}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    disabled={!isEditing}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    disabled={!isEditing}
                    rows={4}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            {profile.role === "mentor" && (
              <Card className="mentor-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={profile.company}
                      disabled={!isEditing}
                      onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={profile.position}
                      disabled={!isEditing}
                      onChange={(e) => setProfile(prev => ({ ...prev, position: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Experience</Label>
                    <Select
                      value={profile.experience}
                      disabled={!isEditing}
                      onValueChange={(value) => setProfile(prev => ({ ...prev, experience: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2 years">1-2 years</SelectItem>
                        <SelectItem value="3-5 years">3-5 years</SelectItem>
                        <SelectItem value="5-10 years">5-10 years</SelectItem>
                        <SelectItem value="10+ years">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate</Label>
                    <Input
                      id="hourlyRate"
                      value={profile.hourlyRate}
                      disabled={!isEditing}
                      onChange={(e) => setProfile(prev => ({ ...prev, hourlyRate: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="education">Education</Label>
                    <Input
                      id="education"
                      value={profile.education}
                      disabled={!isEditing}
                      onChange={(e) => setProfile(prev => ({ ...prev, education: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mentor: Services, Industries, Formats */}
            {profile.role === "mentor" && (
              <Card className="mentor-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" /> Mentoring Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Services Offered</Label>
                    <div className="flex flex-wrap gap-2 mb-3 mt-2">
                      {mentorExtras.services.map((s) => (
                        <Badge key={s} variant="secondary" className="text-sm">
                          {s}
                          {isEditing && (
                            <Button variant="ghost" size="sm" className="ml-2 h-4 w-4 p-0" onClick={() => removeService(s)}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex space-x-2">
                        <Input placeholder="Add service" value={newService} onChange={(e) => setNewService(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addService()} />
                        <Button onClick={addService} size="icon"><Plus className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Industries</Label>
                    <div className="flex flex-wrap gap-2 mb-3 mt-2">
                      {mentorExtras.industries.map((s) => (
                        <Badge key={s} variant="outline" className="text-sm">
                          {s}
                          {isEditing && (
                            <Button variant="ghost" size="sm" className="ml-2 h-4 w-4 p-0" onClick={() => removeIndustry(s)}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex space-x-2">
                        <Input placeholder="Add industry" value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addIndustry()} />
                        <Button onClick={addIndustry} size="icon"><Plus className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Mentoring Formats</Label>
                    <div className="flex flex-wrap gap-2 mb-3 mt-2">
                      {mentorExtras.formats.map((s) => (
                        <Badge key={s} variant="secondary" className="text-sm">
                          {s}
                          {isEditing && (
                            <Button variant="ghost" size="sm" className="ml-2 h-4 w-4 p-0" onClick={() => removeFormat(s)}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex space-x-2">
                        <Input placeholder="Add format" value={newFormat} onChange={(e) => setNewFormat(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addFormat()} />
                        <Button onClick={addFormat} size="icon"><Plus className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle>Skills & Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {skill}
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-4 w-4 p-0"
                          onClick={() => removeSkill(skill)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add new skill"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    />
                    <Button onClick={addSkill} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Availability */}
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" /> Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {profile.availability.length > 0 ? (
                    <div className="space-y-2">
                      {profile.availability.map((slot, idx) => (
                        <div key={`${slot}-${idx}`} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">{slot}</span>
                          {isEditing && (
                            <Button variant="ghost" size="sm" onClick={() => removeAvailability(slot)}>
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No availability set</p>
                  )}
                </div>

                {isEditing && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                    <div className="space-y-1">
                      <Label>Day</Label>
                      <Select value={newAvailabilityDay} onValueChange={setNewAvailabilityDay}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monday">Monday</SelectItem>
                          <SelectItem value="Tuesday">Tuesday</SelectItem>
                          <SelectItem value="Wednesday">Wednesday</SelectItem>
                          <SelectItem value="Thursday">Thursday</SelectItem>
                          <SelectItem value="Friday">Friday</SelectItem>
                          <SelectItem value="Saturday">Saturday</SelectItem>
                          <SelectItem value="Sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Start</Label>
                      <Input type="time" value={newAvailabilityStart} onChange={(e) => setNewAvailabilityStart(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>End</Label>
                      <Input type="time" value={newAvailabilityEnd} onChange={(e) => setNewAvailabilityEnd(e.target.value)} />
                    </div>
                    <div>
                      <Button onClick={addAvailability} className="w-full">
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Languages */}
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Languages className="h-5 w-5 mr-2" />
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.languages.map((language, index) => (
                    <Badge key={index} variant="outline">
                      {language}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add new language"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                    />
                    <Button onClick={addLanguage} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certifications */}
            {profile.role === "mentor" && (
              <Card className="mentor-card">
                <CardHeader>
                  <CardTitle>Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {profile.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span>{cert}</span>
                        {isEditing && (
                          <Button variant="ghost" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add new certification"
                        value={newCertification}
                        onChange={(e) => setNewCertification(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                      />
                      <Button onClick={addCertification} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Mentee: Learning Profile */}
            {profile.role !== "mentor" && (
              <>
                <Card className="mentor-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TargetIcon className="h-5 w-5 mr-2" /> Learning Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Current Level</Label>
                      <Select value={menteeExtras.currentLevel} disabled={!isEditing} onValueChange={(v) => setMenteeExtras(prev => ({ ...prev, currentLevel: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Junior">Junior</SelectItem>
                          <SelectItem value="Mid">Mid</SelectItem>
                          <SelectItem value="Senior">Senior</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Target Role</Label>
                      <Input value={menteeExtras.targetRole} disabled={!isEditing} onChange={(e) => setMenteeExtras(prev => ({ ...prev, targetRole: e.target.value }))} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Preferred Learning Style</Label>
                      <Select value={menteeExtras.learningStyle} disabled={!isEditing} onValueChange={(v) => setMenteeExtras(prev => ({ ...prev, learningStyle: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hands-on Projects">Hands-on Projects</SelectItem>
                          <SelectItem value="Guided Tutorials">Guided Tutorials</SelectItem>
                          <SelectItem value="Reading & Notes">Reading & Notes</SelectItem>
                          <SelectItem value="Pair Programming">Pair Programming</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mentor-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2" /> Goals & Interests
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>Learning Goals</Label>
                      <div className="flex flex-wrap gap-2 mb-3 mt-2">
                        {menteeExtras.goals.map((g) => (
                          <Badge key={g} variant="secondary" className="text-sm">
                            {g}
                            {isEditing && (
                              <Button variant="ghost" size="sm" className="ml-2 h-4 w-4 p-0" onClick={() => removeGoal(g)}>
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </Badge>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="flex space-x-2">
                          <Input placeholder="Add goal" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addGoal()} />
                          <Button onClick={addGoal} size="icon"><Plus className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Interests</Label>
                      <div className="flex flex-wrap gap-2 mb-3 mt-2">
                        {menteeExtras.interests.map((i) => (
                          <Badge key={i} variant="outline" className="text-sm">
                            {i}
                            {isEditing && (
                              <Button variant="ghost" size="sm" className="ml-2 h-4 w-4 p-0" onClick={() => removeInterest(i)}>
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </Badge>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="flex space-x-2">
                          <Input placeholder="Add interest" value={newInterest} onChange={(e) => setNewInterest(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addInterest()} />
                          <Button onClick={addInterest} size="icon"><Plus className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="mentor-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Link2 className="h-5 w-5 mr-2" /> Portfolio Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {menteeExtras.portfolioLinks.map((l) => (
                        <div key={l} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="truncate mr-2">{l}</span>
                          {isEditing && (
                            <Button variant="ghost" size="sm" onClick={() => removePortfolioLink(l)}>
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex space-x-2">
                        <Input placeholder="https://..." value={newPortfolioLink} onChange={(e) => setNewPortfolioLink(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addPortfolioLink()} />
                        <Button onClick={addPortfolioLink} size="icon"><Plus className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;