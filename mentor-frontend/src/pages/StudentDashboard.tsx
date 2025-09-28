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
import { Search, BookOpen, Calendar, MessageCircle, Star, Clock, User, Edit3, Phone, Mail, MapPin, Target, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const StudentDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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

  // Load student profile on component mount
  useEffect(() => {
    const loadStudentProfile = async () => {
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
        
        // Set basic user info
        setStudentProfile(prev => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || ""
        }));

        // Try to fetch existing profile data from backend
        if (user.email) {
          try {
            const profileResponse = await fetch(`http://localhost:3000/api/profile/${encodeURIComponent(user.email)}`);
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
            }
          } catch (profileError) {
            console.log('No existing profile found, using user registration data');
          }
        }

      } catch (error) {
        console.error('Error loading student profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentProfile();
  }, [toast]);

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

      const response = await fetch('http://localhost:3000/api/profile', {
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

  // Mock data
  const upcomingSessions = [
    {
      id: 1,
      mentor: "Dr. Sarah Johnson",
      domain: "Software Engineering",
      date: "Dec 25, 2024",
      time: "2:00 PM",
      avatar: "👩‍💻"
    },
    {
      id: 2,
      mentor: "Marcus Chen",
      domain: "Data Science",
      date: "Dec 27, 2024", 
      time: "10:00 AM",
      avatar: "👨‍🔬"
    }
  ];

  const recommendedMentors = [
    {
      id: 1,
      name: "Elena Rodriguez",
      domain: "UX Design",
      rating: 4.9,
      sessions: 120,
      avatar: "👩‍🎨",
      skills: ["Figma", "User Research", "Prototyping"]
    },
    {
      id: 2,
      name: "David Kim",
      domain: "Product Management",
      rating: 4.7,
      sessions: 85,
      avatar: "👨‍💼",
      skills: ["Strategy", "Analytics", "Roadmapping"]
    }
  ];

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
                  <p className="text-2xl font-bold text-card-foreground">12</p>
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
                  <p className="text-2xl font-bold text-card-foreground">5</p>
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
                  <p className="text-2xl font-bold text-card-foreground">24</p>
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
                  <p className="text-2xl font-bold text-card-foreground">4.8</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Sessions */}
          <div>
            <Card className="mentor-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    Upcoming Sessions
                  </CardTitle>
                  <Link to="/sessions">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingSessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{session.avatar}</div>
                      <div>
                        <p className="font-medium text-card-foreground">{session.mentor}</p>
                        <p className="text-sm text-muted-foreground">{session.domain}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-card-foreground">{session.date}</p>
                      <p className="text-sm text-muted-foreground">{session.time}</p>
                    </div>
                  </div>
                ))}
                {upcomingSessions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No upcoming sessions</p>
                    <Link to="/mentors">
                      <Button variant="hero" className="mt-4">Book a Session</Button>
                    </Link>
                  </div>
                )}
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
                  <div key={mentor.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{mentor.avatar}</div>
                        <div>
                          <p className="font-medium text-card-foreground">{mentor.name}</p>
                          <p className="text-sm text-muted-foreground">{mentor.domain}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{mentor.rating}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {mentor.skills.map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full">
                      Request Session
                    </Button>
                  </div>
                ))}
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