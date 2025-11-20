import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, BookOpen, Calendar, MessageCircle, Star, Clock, User, Edit3, Phone, Mail, MapPin, Target, Briefcase, MessageSquare, Check, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/useSocket";
import { API_ENDPOINTS } from "@/lib/api";

const StudentDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Real data from backend
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [recommendedMentors, setRecommendedMentors] = useState<any[]>([]);
  const [chatRequests, setChatRequests] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState({
    completedSessions: 0,
    activeMentors: 0,
    hoursLearned: 0,
    averageRating: 0
  });

  // Student profile state
  const [studentProfile, setStudentProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    targetRole: "",
    currentLevel: "Junior",
    learningStyle: "",
    skills: [] as string[],
    goals: [] as string[],
    interests: [] as string[],
    portfolioLinks: [] as string[]
  });

  // Form inputs for adding new items
  const [newSkill, setNewSkill] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newPortfolioLink, setNewPortfolioLink] = useState("");
  
  // Socket connection
  const { socket } = useSocket(currentUser?.email);

  // Load student profile and dashboard data on component mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
        
        if (!userData) {
          toast({
            title: "Session Expired",
            description: "Please log in to access your dashboard",
            variant: "destructive"
          });
          return;
        }

        const user = JSON.parse(userData);
        setCurrentUser(user);
        
        // Set basic user info
        setStudentProfile(prev => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || ""
        }));

        // Fetch profile data from backend
        if (user.email) {
          try {
            const profileResponse = await fetch(API_ENDPOINTS.PROFILE_BY_EMAIL(user.email));
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              
              // Update student profile with backend data
              setStudentProfile(prev => ({
                ...prev,
                ...profileData.user,
                name: user.name || profileData.user.name || "",
                email: user.email || profileData.user.email || "",
                targetRole: profileData.user.mentee?.targetRole || "",
                currentLevel: profileData.user.mentee?.currentLevel || "Junior",
                goals: profileData.user.mentee?.goals ? profileData.user.mentee.goals.split(", ") : [],
                interests: profileData.user.mentee?.interests ? profileData.user.mentee.interests.split(", ") : [],
                portfolioLinks: profileData.user.mentee?.portfolioLinks || []
              }));

              // Update stats from profile
              if (profileData.user.mentee) {
                setStats({
                  completedSessions: profileData.user.mentee.completedSessions || 0,
                  activeMentors: profileData.user.mentee.activeMentors || 0,
                  hoursLearned: profileData.user.mentee.hoursLearned || 0,
                  averageRating: profileData.user.mentee.averageRating || 0
                });
              }
            }
          } catch (profileError) {
            console.log('No existing profile found, using user registration data');
          }
        }

        // Fetch upcoming sessions (bookings)
        if (user.id) {
          try {
            const bookingsResponse = await fetch(API_ENDPOINTS.BOOKINGS_BY_USER(user.id));
            if (bookingsResponse.ok) {
              const bookingsData = await bookingsResponse.json();
              
              // Filter for upcoming sessions (confirmed status and future dates)
              const now = new Date();
              const upcoming = bookingsData.bookings
                ?.filter((booking: any) => 
                  booking.status === 'confirmed' && 
                  new Date(booking.date) >= now
                )
                .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5) || [];
              
              setUpcomingSessions(upcoming);
            }
          } catch (bookingError) {
            console.log('Error fetching bookings:', bookingError);
          }
        }

        // Fetch recommended mentors
        try {
          const mentorsResponse = await fetch(`${API_ENDPOINTS.MENTORS}?limit=5`);
          if (mentorsResponse.ok) {
            const mentorsData = await mentorsResponse.json();
            setRecommendedMentors(mentorsData.mentors || []);
          }
        } catch (mentorError) {
          console.log('Error fetching mentors:', mentorError);
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  // Load chat requests
  const loadChatRequests = async () => {
    if (!currentUser?.email) return;
    
    try {
      const response = await fetch(API_ENDPOINTS.CHAT_REQUEST_ALL(currentUser.email));
      if (response.ok) {
        const data = await response.json();
        
        // Enrich requests with user details
        const enrichedRequests = await Promise.all(
          data.requests.map(async (req: any) => {
            try {
              const userEmail = req.receiver === currentUser.email ? req.sender : req.receiver;
              const userResponse = await fetch(API_ENDPOINTS.PROFILE_BY_EMAIL(userEmail));
              if (userResponse.ok) {
                const userData = await userResponse.json();
                return {
                  ...req,
                  otherUser: userData.user
                };
              }
            } catch (error) {
              console.error('Error fetching user details:', error);
            }
            return req;
          })
        );
        
        setChatRequests(enrichedRequests);
      }
    } catch (error) {
      console.error('Error loading chat requests:', error);
    }
  };

  // Load chat requests when user is available
  useEffect(() => {
    if (currentUser?.email) {
      loadChatRequests();
    }
  }, [currentUser]);

  // Socket listener for chat request updates
  useEffect(() => {
    if (!socket || !currentUser?.email) return;

    const handleChatRequestResponse = (data: any) => {
      console.log('Chat request response received:', data);
      
      // Show notification
      toast({
        title: data.status === 'approved' ? 'Request Approved!' : 'Request Declined',
        description: data.status === 'approved' 
          ? `${data.mentorName} has approved your chat request. You can now start messaging!`
          : `${data.mentorName} has declined your chat request.`,
        variant: data.status === 'approved' ? 'default' : 'destructive'
      });

      // Reload requests
      loadChatRequests();
    };

    socket.on('chat-request-response', handleChatRequestResponse);

    return () => {
      socket.off('chat-request-response', handleChatRequestResponse);
    };
  }, [socket, currentUser, toast]);

  // Profile update functions
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const profileData = {
        ...studentProfile,
        role: "student",
        menteeExtras: {
          targetRole: studentProfile.targetRole,
          currentLevel: studentProfile.currentLevel,
          learningStyle: studentProfile.learningStyle,
          goals: studentProfile.goals,
          interests: studentProfile.interests,
          portfolioLinks: studentProfile.portfolioLinks
        }
      };

      const response = await fetch(API_ENDPOINTS.PROFILE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        toast({
          title: "Profile updated successfully!",
          description: "Your changes have been saved.",
        });
        
        // Update localStorage with the new user data
        const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          const updatedUser = { ...user, name: studentProfile.name };
          localStorage.setItem('authUser', JSON.stringify(updatedUser));
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        setIsProfileDialogOpen(false);
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

  // Helper functions for managing arrays
  const addSkill = () => {
    if (newSkill.trim() && !studentProfile.skills.includes(newSkill.trim())) {
      setStudentProfile(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setStudentProfile(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const addGoal = () => {
    if (newGoal.trim() && !studentProfile.goals.includes(newGoal.trim())) {
      setStudentProfile(prev => ({ ...prev, goals: [...prev.goals, newGoal.trim()] }));
      setNewGoal("");
    }
  };

  const removeGoal = (goal: string) => {
    setStudentProfile(prev => ({ ...prev, goals: prev.goals.filter(g => g !== goal) }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !studentProfile.interests.includes(newInterest.trim())) {
      setStudentProfile(prev => ({ ...prev, interests: [...prev.interests, newInterest.trim()] }));
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setStudentProfile(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
  };

  const addPortfolioLink = () => {
    if (newPortfolioLink.trim() && !studentProfile.portfolioLinks.includes(newPortfolioLink.trim())) {
      setStudentProfile(prev => ({ ...prev, portfolioLinks: [...prev.portfolioLinks, newPortfolioLink.trim()] }));
      setNewPortfolioLink("");
    }
  };

  const removePortfolioLink = (link: string) => {
    setStudentProfile(prev => ({ ...prev, portfolioLinks: prev.portfolioLinks.filter(l => l !== link) }));
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper function to get initials for avatar
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
      <div className="flex-1 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome back, {studentProfile.name || "Student"}! 👋
              </h1>
              <p className="text-muted-foreground">
                Continue your learning journey with amazing mentors
              </p>
            </div>
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Update Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Update Your Profile</DialogTitle>
                  <DialogDescription>
                    Keep your information up to date to get better mentor recommendations
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={studentProfile.name}
                        onChange={(e) => setStudentProfile(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={studentProfile.email}
                        onChange={(e) => setStudentProfile(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your.email@example.com"
                        disabled
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={studentProfile.phone}
                        onChange={(e) => setStudentProfile(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Your phone number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={studentProfile.location}
                        onChange={(e) => setStudentProfile(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="City, Country"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={studentProfile.bio}
                        onChange={(e) => setStudentProfile(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Learning Goals & Interests */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Learning Profile</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="targetRole">Target Role</Label>
                      <Input
                        id="targetRole"
                        value={studentProfile.targetRole}
                        onChange={(e) => setStudentProfile(prev => ({ ...prev, targetRole: e.target.value }))}
                        placeholder="e.g., Full-Stack Developer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentLevel">Current Level</Label>
                      <Select
                        value={studentProfile.currentLevel}
                        onValueChange={(value) => setStudentProfile(prev => ({ ...prev, currentLevel: value }))}
                      >
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

                    <div className="space-y-2">
                      <Label htmlFor="learningStyle">Learning Style</Label>
                      <Input
                        id="learningStyle"
                        value={studentProfile.learningStyle}
                        onChange={(e) => setStudentProfile(prev => ({ ...prev, learningStyle: e.target.value }))}
                        placeholder="e.g., Hands-on Projects, Visual Learning"
                      />
                    </div>

                    {/* Skills */}
                    <div className="space-y-2">
                      <Label>Skills</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {studentProfile.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                            {skill} ✕
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Add a skill"
                          onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                        />
                        <Button type="button" onClick={addSkill} size="sm">Add</Button>
                      </div>
                    </div>

                    {/* Goals */}
                    <div className="space-y-2">
                      <Label>Learning Goals</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {studentProfile.goals.map((goal, index) => (
                          <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => removeGoal(goal)}>
                            {goal} ✕
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newGoal}
                          onChange={(e) => setNewGoal(e.target.value)}
                          placeholder="Add a learning goal"
                          onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                        />
                        <Button type="button" onClick={addGoal} size="sm">Add</Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interests and Portfolio Links - Full Width */}
                <div className="space-y-4">
                  {/* Interests */}
                  <div className="space-y-2">
                    <Label>Interests</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {studentProfile.interests.map((interest, index) => (
                        <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => removeInterest(interest)}>
                          {interest} ✕
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        placeholder="Add an interest"
                        onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                      />
                      <Button type="button" onClick={addInterest} size="sm">Add</Button>
                    </div>
                  </div>

                  {/* Portfolio Links */}
                  <div className="space-y-2">
                    <Label>Portfolio Links</Label>
                    <div className="space-y-2 mb-2">
                      {studentProfile.portfolioLinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <span className="flex-1 text-sm">{link}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePortfolioLink(link)}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newPortfolioLink}
                        onChange={(e) => setNewPortfolioLink(e.target.value)}
                        placeholder="Add portfolio link (GitHub, personal website, etc.)"
                        onKeyPress={(e) => e.key === 'Enter' && addPortfolioLink()}
                      />
                      <Button type="button" onClick={addPortfolioLink} size="sm">Add</Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsProfileDialogOpen(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="mentor-card">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-primary/10 p-3 rounded-full">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">{stats.completedSessions}</p>
                  <p className="text-muted-foreground text-sm">Sessions Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mentor-card">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-secondary/10 p-3 rounded-full">
                  <MessageCircle className="h-6 w-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">{stats.activeMentors}</p>
                  <p className="text-muted-foreground text-sm">Active Mentors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mentor-card">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-accent/20 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">{stats.hoursLearned}</p>
                  <p className="text-muted-foreground text-sm">Hours Learned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mentor-card">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">{stats.averageRating.toFixed(1)}</p>
                  <p className="text-muted-foreground text-sm">Avg Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Summary */}
        <div className="mb-8">
          <Card className="mentor-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Your Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{studentProfile.email || "Not provided"}</span>
                  </div>
                  {studentProfile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{studentProfile.phone}</span>
                    </div>
                  )}
                  {studentProfile.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{studentProfile.location}</span>
                    </div>
                  )}
                  {studentProfile.targetRole && (
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Target: {studentProfile.targetRole}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Level: {studentProfile.currentLevel}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {studentProfile.skills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {studentProfile.skills.slice(0, 4).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {studentProfile.skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{studentProfile.skills.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {studentProfile.interests.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Interests:</p>
                      <div className="flex flex-wrap gap-1">
                        {studentProfile.interests.slice(0, 3).map((interest, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                        {studentProfile.interests.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{studentProfile.interests.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {(!studentProfile.skills.length && !studentProfile.interests.length) && (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm">Complete your profile to get better recommendations!</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Requests Section */}
        {chatRequests.length > 0 && (
          <Card className="mentor-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                Chat Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chatRequests
                  .filter(req => req.sender === currentUser?.email)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5)
                  .map((request) => (
                    <div 
                      key={request._id} 
                      className={`p-4 rounded-lg border-l-4 ${
                        request.status === 'approved' 
                          ? 'border-l-green-500 bg-green-50 dark:bg-green-950/20' 
                          : request.status === 'declined'
                          ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
                          : 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                            {request.otherUser?.name ? getInitials(request.otherUser.name) : 'M'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-card-foreground">
                                {request.otherUser?.name || 'Mentor'}
                              </p>
                              <Badge 
                                variant={
                                  request.status === 'approved' 
                                    ? 'default' 
                                    : request.status === 'declined'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="text-xs"
                              >
                                {request.status === 'approved' && <Check className="h-3 w-3 mr-1" />}
                                {request.status === 'declined' && <X className="h-3 w-3 mr-1" />}
                                {request.status === 'pending' && <AlertCircle className="h-3 w-3 mr-1" />}
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {request.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Sent {new Date(request.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-3">
                          {request.status === 'approved' && (
                            <Link to={`/chat?user=${encodeURIComponent(request.receiver)}`}>
                              <Button size="sm" variant="hero">
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Open Chat
                              </Button>
                            </Link>
                          )}
                          {request.status === 'declined' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                // Could implement resend functionality here
                                toast({
                                  title: "Feature Coming Soon",
                                  description: "Request resend feature will be available soon."
                                });
                              }}
                            >
                              Resend
                            </Button>
                          )}
                          {request.status === 'pending' && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Waiting
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                
                {chatRequests.filter(req => req.sender === currentUser?.email).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No chat requests sent yet</p>
                    <Link to="/mentors">
                      <Button variant="hero" className="mt-4">Find Mentors</Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Sessions & Available Mentors */}
          <div>
            <Card className="mentor-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    My Bookings
                  </CardTitle>
                  <Link to="/booking">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Always show available mentors section */}
                <div>
                  {upcomingSessions.length > 0 && (
                    <>
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Upcoming Sessions</h3>
                      <div className="space-y-3 mb-4">
                        {upcomingSessions.map(session => (
                          <div key={session._id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                {getInitials(session.mentorName)}
                              </div>
                              <div>
                                <p className="font-medium text-card-foreground">{session.mentorName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(session.date)} at {session.time}
                                </p>
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {session.sessionType}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-4"></div>
                    </>
                  )}
                  
                  {upcomingSessions.length === 0 && (
                    <div className="text-center py-3 mb-4 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground text-sm mb-1">No upcoming sessions</p>
                      <p className="text-xs text-muted-foreground">Book a session with available mentors below</p>
                    </div>
                  )}
                  
                  {/* Always show available mentors */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center">
                      <Star className="h-4 w-4 mr-1 text-green-600" />
                      Available Mentors for Booking
                    </h3>
                    {recommendedMentors.length > 0 ? (
                      <div className="space-y-2">
                        {recommendedMentors.slice(0, 3).map(mentor => (
                          <div key={mentor._id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400 font-semibold">
                                {getInitials(mentor.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-card-foreground">{mentor.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {mentor.mentor?.domain || mentor.company || 'Mentor'}
                                </p>
                                {mentor.mentor?.averageRating > 0 && (
                                  <div className="flex items-center space-x-1 text-xs mt-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{mentor.mentor.averageRating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Link to={`/mentors?mentor=${mentor._id}`}>
                              <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                                Book Session
                              </Button>
                            </Link>
                          </div>
                        ))}
                        <Link to="/mentors">
                          <Button variant="outline" className="w-full mt-2">
                            View All Mentors
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground text-sm mb-3">No mentors available</p>
                        <Link to="/mentors">
                          <Button variant="hero">Browse Mentors</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommended Mentors */}
          <div>
            <Card className="mentor-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2 text-primary" />
                    Recommended Mentors
                  </CardTitle>
                  <Link to="/mentors">
                    <Button variant="ghost" size="sm">Browse All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendedMentors.map(mentor => (
                  <div key={mentor._id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-semibold">
                          {getInitials(mentor.name)}
                        </div>
                        <div>
                          <p className="font-medium text-card-foreground">{mentor.name}</p>
                          <p className="text-sm text-muted-foreground">{mentor.company || mentor.mentor?.domain || 'Mentor'}</p>
                        </div>
                      </div>
                      {mentor.mentor?.averageRating > 0 && (
                        <div className="flex items-center space-x-1 text-sm">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{mentor.mentor.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(mentor.skills || []).slice(0, 3).map((skill: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {(mentor.skills || []).length === 0 && (
                        <Badge variant="outline" className="text-xs">
                          {mentor.mentor?.experience || 'Experienced'}
                        </Badge>
                      )}
                    </div>
                    <Link to={`/mentors?mentor=${mentor._id}`}>
                      <Button variant="outline" className="w-full">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                ))}
                {recommendedMentors.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No mentors available</p>
                    <Link to="/mentors">
                      <Button variant="hero" className="mt-4">Browse Mentors</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="mentor-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link to="/mentors">
                  <Button variant="hero" className="w-full h-20 flex flex-col">
                    <Search className="h-6 w-6 mb-2" />
                    Find New Mentors
                  </Button>
                </Link>
                <Link to="/sessions">
                  <Button variant="outline" className="w-full h-20 flex flex-col">
                    <Calendar className="h-6 w-6 mb-2" />
                    View Schedule
                  </Button>
                </Link>
                <Link to="/messages">
                  <Button variant="outline" className="w-full h-20 flex flex-col">
                    <MessageCircle className="h-6 w-6 mb-2" />
                    Messages
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="outline" className="w-full h-20 flex flex-col">
                    <User className="h-6 w-6 mb-2" />
                    Full Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;