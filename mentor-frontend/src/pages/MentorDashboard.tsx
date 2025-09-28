import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MessageCircle, Star, Users, Clock, Edit, Check, X, Upload, Link2, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MentorDashboard = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    expertise: "",
    experience: "",
    skills: [] as string[],
    availability: true,
    hourlyRate: "",
    email: "",
    phone: "",
    location: "",
    languages: [] as string[],
    certifications: [] as string[],
    education: "",
    position: ""
  });

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shareTitle, setShareTitle] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [shareDescription, setShareDescription] = useState("");
  const [shareCategory, setShareCategory] = useState<string | undefined>(undefined);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get user data from localStorage
        const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
        if (!userData) {
          toast({
            title: "Session Expired",
            description: "Please log in to access your dashboard",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        const user = JSON.parse(userData);
        
        // Set basic user info
        setProfile(prev => ({
          ...prev,
          name: user.name || "",
          // You can add other fields from user registration here
        }));

        // Fetch mentor profile data from the unified profile API
        if (user.email) {
          try {
            console.log('Fetching mentor profile for email:', user.email);
            const profileResponse = await fetch(`http://localhost:3000/api/profile/${encodeURIComponent(user.email)}`);
            console.log('Profile response status:', profileResponse.status);
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              console.log('Profile data received:', profileData);
              
              // Update mentor profile with backend data
              setProfile(prev => ({
                ...prev,
                name: profileData.user.name || user.name || "",
                bio: profileData.user.bio || "",
                expertise: profileData.user.company || "",
                experience: profileData.user.mentor?.experience || "",
                skills: profileData.user.skills || [],
                hourlyRate: profileData.user.mentor?.hourlyRate || "",
                // Add other mentor specific fields
                email: profileData.user.email || user.email || "",
                phone: profileData.user.phone || "",
                location: profileData.user.location || "",
                languages: profileData.user.languages || [],
                certifications: profileData.user.certifications || [],
                education: profileData.user.education || "",
                position: profileData.user.position || ""
              }));
              console.log('Mentor profile loaded successfully');
            } else {
              const errorText = await profileResponse.text();
              console.log('Profile response error:', errorText);
              console.log('No existing profile found, using user registration data');
            }
          } catch (profileError) {
            console.log('Error fetching profile, using user registration data:', profileError);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [toast]);

  // Dynamic session requests state
  const [sessionRequests, setSessionRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Load session requests from API
  useEffect(() => {
    const loadSessionRequests = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/mentor/session-requests');
        if (response.ok) {
          const requests = await response.json();
          setSessionRequests(requests);
        } else {
          console.log('No session requests found');
          setSessionRequests([]);
        }
      } catch (error) {
        console.error('Error loading session requests:', error);
        toast({
          title: "Error",
          description: "Failed to load session requests",
          variant: "destructive"
        });
        setSessionRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };

    loadSessionRequests();
  }, [toast]);

  // Dynamic upcoming sessions state
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Load upcoming sessions from API
  useEffect(() => {
    const loadUpcomingSessions = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/mentor/sessions');
        if (response.ok) {
          const sessions = await response.json();
          setUpcomingSessions(sessions);
        } else {
          console.log('No upcoming sessions found');
          setUpcomingSessions([]);
        }
      } catch (error) {
        console.error('Error loading upcoming sessions:', error);
        toast({
          title: "Error",
          description: "Failed to load upcoming sessions",
          variant: "destructive"
        });
        setUpcomingSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    };

    loadUpcomingSessions();
  }, [toast]);

  // Refresh functions to reload data
  const refreshSessionRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await fetch('http://localhost:3000/api/mentor/session-requests');
      if (response.ok) {
        const requests = await response.json();
        setSessionRequests(requests);
      }
    } catch (error) {
      console.error('Error refreshing session requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const refreshUpcomingSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await fetch('http://localhost:3000/api/mentor/sessions');
      if (response.ok) {
        const sessions = await response.json();
        setUpcomingSessions(sessions);
      }
    } catch (error) {
      console.error('Error refreshing upcoming sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) {
      toast({ title: "Files uploaded!", description: `${files.length} file(s) shared with students (mock).` });
      e.currentTarget.value = "";
    }
  };

  const handleShareLink = async () => {
    if (!shareTitle || !shareUrl) {
      toast({ title: "Missing details", description: "Please provide a title and a valid URL.", variant: "destructive" });
      return;
    }
    
    try {
      const res = await fetch("http://localhost:3000/api/mentor/resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: shareTitle, 
          url: shareUrl, 
          description: shareDescription, 
          category: shareCategory 
        }),
      });
      
      if (res.ok) {
        toast({ title: "Link shared!", description: `${shareTitle} has been shared successfully.` });
        setShareTitle("");
        setShareUrl("");
        setShareDescription("");
        setShareCategory(undefined);
      } else {
        throw new Error("Failed to share link");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to share link. Using mock response for now.", variant: "destructive" });
      // Fallback to mock behavior
      toast({ title: "Link shared!", description: `${shareTitle} has been shared (mock).` });
      setShareTitle("");
      setShareUrl("");
      setShareDescription("");
      setShareCategory(undefined);
    }
  };

  const handleSessionRequest = async (requestId: number, action: "accept" | "decline") => {
    try {
      const response = await fetch(`http://localhost:3000/api/mentor/session-request/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action === "accept" ? "accepted" : "declined" })
      });

      if (response.ok) {
        // Refresh both session requests and upcoming sessions
        await refreshSessionRequests();
        if (action === "accept") {
          await refreshUpcomingSessions();
        }

        toast({
          title: action === "accept" ? "Session accepted!" : "Session declined",
          description: `You have ${action}ed the session request.`,
        });
      } else {
        throw new Error('Failed to update session request');
      }
    } catch (error) {
      console.error('Error updating session request:', error);
      toast({
        title: "Error",
        description: "Failed to update session request",
        variant: "destructive"
      });
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !profile.skills.includes(skill)) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };
  const handleProfileUpdate = async () => {
    try {
      // Get user data from localStorage to include email
      const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
      let userEmail = "";
      if (userData) {
        const user = JSON.parse(userData);
        userEmail = user.email || "";
      }

      // Prepare complete profile data in the format expected by the unified profile endpoint
      const profileData = {
        name: profile.name,
        email: userEmail,
        phone: profile.phone || "",
        location: profile.location || "",
        role: "mentor",
        bio: profile.bio,
        skills: profile.skills || [],
        languages: profile.languages || [],
        experience: profile.experience || "",
        hourlyRate: profile.hourlyRate || "",
        certifications: profile.certifications || [],
        education: profile.education || "",
        company: profile.expertise || "",
        position: profile.position || "",
        
        // Include mentor-specific extras
        mentorExtras: {
          services: [], // You can extend this based on your UI
          industries: [],
          formats: []
        }
      };

      const res = await fetch("http://localhost:3000/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      
      if (res.ok) {
        const data = await res.json();
        toast({ title: "Profile updated!", description: data.message });
        
        // Update localStorage with the new user data
        const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          const updatedUser = { ...user, name: profile.name };
          localStorage.setItem('authUser', JSON.stringify(updatedUser));
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        // Refresh the profile data to show updated information
        await refreshProfileData();
        
        setIsEditing(false);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  // Function to refresh profile data
  const refreshProfileData = async () => {
    try {
      const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      if (!user.email) return;

      const profileResponse = await fetch(`http://localhost:3000/api/profile/${encodeURIComponent(user.email)}`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        
        // Update profile state with fresh data
        setProfile(prev => ({
          ...prev,
          name: profileData.user.name || user.name || "",
          bio: profileData.user.bio || "",
          expertise: profileData.user.company || "",
          experience: profileData.user.mentor?.experience || "",
          skills: profileData.user.skills || [],
          hourlyRate: profileData.user.mentor?.hourlyRate || "",
          email: profileData.user.email || user.email || "",
          phone: profileData.user.phone || "",
          location: profileData.user.location || "",
          languages: profileData.user.languages || [],
          certifications: profileData.user.certifications || [],
          education: profileData.user.education || "",
          position: profileData.user.position || ""
        }));
        
        console.log('Profile data refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    }
  };

  return (
    <div className="flex-1 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isLoading ? (
              "Loading... 👋"
            ) : (
              `Welcome back, ${profile.name || 'Mentor'}! 👋`
            )}
          </h1>
          <p className="text-muted-foreground">
            Manage your mentoring activities and help students succeed
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="mentor-card">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">24</p>
                  <p className="text-muted-foreground text-sm">Active Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mentor-card">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-secondary/10 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">150</p>
                  <p className="text-muted-foreground text-sm">Sessions Completed</p>
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
                  <p className="text-2xl font-bold text-card-foreground">4.9</p>
                  <p className="text-muted-foreground text-sm">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mentor-card">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">180</p>
                  <p className="text-muted-foreground text-sm">Hours Mentored</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="requests">Session Requests</TabsTrigger>
            <TabsTrigger value="schedule">Upcoming Sessions</TabsTrigger>
            <TabsTrigger value="profile">Profile Management</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Session Requests */}
          <TabsContent value="requests" className="space-y-6">
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                  Pending Session Requests ({sessionRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingRequests ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading session requests...</p>
                  </div>
                ) : sessionRequests.length > 0 ? (
                  sessionRequests.map(request => (
                    <div key={request._id || request.id} className="p-6 bg-muted/50 rounded-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{request.avatar || "👨‍💻"}</div>
                          <div>
                            <h4 className="font-semibold text-card-foreground">{request.student}</h4>
                            <p className="text-sm text-muted-foreground">{request.topic}</p>
                            <p className="text-sm text-primary font-medium">{request.preferredTime}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4 leading-relaxed">"{request.message}"</p>
                      <div className="flex space-x-3">
                        <Button 
                          variant="hero" 
                          size="sm"
                          onClick={() => handleSessionRequest(request._id || request.id, "accept")}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSessionRequest(request._id || request.id, "decline")}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No pending requests</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Sessions */}
          <TabsContent value="schedule" className="space-y-6">
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingSessions ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading upcoming sessions...</p>
                  </div>
                ) : upcomingSessions.length > 0 ? (
                  upcomingSessions.map(session => (
                    <div key={session._id || session.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{session.avatar || "👨‍🎓"}</div>
                        <div>
                          <p className="font-medium text-card-foreground">{session.student}</p>
                          <p className="text-sm text-muted-foreground">{session.topic}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-card-foreground">{session.date}</p>
                        <p className="text-sm text-muted-foreground">{session.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No upcoming sessions scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Management */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="mentor-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Edit className="h-5 w-5 mr-2 text-primary" />
                    Profile Management
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="availability">Available for sessions</Label>
                    <Switch
                      id="availability"
                      checked={profile.availability}
                      onCheckedChange={(checked) => 
                        setProfile(prev => ({ ...prev, availability: checked }))
                      }
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expertise">Expertise</Label>
                    <Input
                      id="expertise"
                      value={profile.expertise}
                      onChange={(e) => setProfile(prev => ({ ...prev, expertise: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isEditing}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Skills</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.skills.map(skill => (
                      <Badge key={skill} variant="outline" className="text-sm">
                        {skill}
                        {isEditing && (
                          <button
                            onClick={() => removeSkill(skill)}
                            className="ml-2 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <Input
                      placeholder="Add a skill and press Enter"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addSkill(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button variant="hero" onClick={handleProfileUpdate}>
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button variant="hero" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources */}
          <TabsContent value="resources" className="space-y-6">
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" /> Share Study Materials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Upload PDFs, docs, images, zips</div>
                  <Button onClick={handleUploadClick}>
                    <Upload className="h-4 w-4 mr-2" /> Upload Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFilesSelected}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                  />
                </div>

                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  <File className="h-5 w-5 inline mr-2" /> Recently uploaded files will appear here (mock)
                </div>
              </CardContent>
            </Card>

            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Link2 className="h-5 w-5 mr-2" /> Share Study Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shareTitle">Title</Label>
                  <Input id="shareTitle" placeholder="Enter resource title" value={shareTitle} onChange={(e) => setShareTitle(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="shareUrl">URL</Label>
                  <Input id="shareUrl" placeholder="https://example.com" value={shareUrl} onChange={(e) => setShareUrl(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="shareDescription">Description</Label>
                  <Textarea id="shareDescription" rows={3} placeholder="Brief description" value={shareDescription} onChange={(e) => setShareDescription(e.target.value)} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={shareCategory} onValueChange={setShareCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">Course</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="repository">Repository</SelectItem>
                      <SelectItem value="tool">Tool</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleShareLink}>
                    <Link2 className="h-4 w-4 mr-2" /> Share Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MentorDashboard;