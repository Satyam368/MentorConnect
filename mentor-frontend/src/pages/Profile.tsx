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
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";

const Profile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Dynamic user data - loaded from backend
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    role: "student", // default role
    bio: "",
    profilePicture: "",
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
        console.log('Current authUser:', user); // Debug log

        // Set basic user info from registration
        setProfile(prev => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
          role: user.role || "student",
          profilePicture: user.profilePicture || ""
        }));

        // Try to fetch existing profile data from backend
        if (user.email) {
          try {
            console.log('Fetching profile for email:', user.email);
            const profileResponse = await fetch(API_ENDPOINTS.PROFILE_BY_EMAIL(user.email));
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

              // Load role-specific extras if available
              if (profileData.user.mentorExtras) {
                setMentorExtras(profileData.user.mentorExtras);
              }
              if (profileData.user.menteeExtras) {
                setMenteeExtras(profileData.user.menteeExtras);
              }

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

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (JPEG, PNG, GIF, WEBP)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Profile picture must be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingPicture(true);

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      formData.append('email', profile.email);

      const response = await fetch(API_ENDPOINTS.PROFILE_UPLOAD_PICTURE, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => ({ ...prev, profilePicture: data.profilePicture }));

        // Update localStorage so navbar shows the new picture immediately
        const authUser = localStorage.getItem('authUser');
        if (authUser) {
          const userData = JSON.parse(authUser);
          userData.profilePicture = data.profilePicture;
          localStorage.setItem('authUser', JSON.stringify(userData));

          // Dispatch custom event to notify Navigation component
          window.dispatchEvent(new Event('profileUpdated'));
        }

        toast({
          title: "Success",
          description: "Profile picture updated successfully"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive"
      });
    } finally {
      setIsUploadingPicture(false);
    }
  };

  // Handle profile picture deletion
  const handleDeleteProfilePicture = async () => {
    if (!profile.profilePicture) return;

    setIsUploadingPicture(true);

    try {
      const response = await fetch(API_ENDPOINTS.PROFILE_DELETE_PICTURE, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: profile.email })
      });

      if (response.ok) {
        setProfile(prev => ({ ...prev, profilePicture: "" }));

        // Update localStorage to remove the picture from navbar
        const authUser = localStorage.getItem('authUser');
        if (authUser) {
          const userData = JSON.parse(authUser);
          userData.profilePicture = "";
          localStorage.setItem('authUser', JSON.stringify(userData));

          // Dispatch custom event to notify Navigation component
          window.dispatchEvent(new Event('profileUpdated'));
        }

        toast({
          title: "Success",
          description: "Profile picture deleted successfully"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Delete failed');
      }
    } catch (error: any) {
      console.error('Error deleting profile picture:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete profile picture",
        variant: "destructive"
      });
    } finally {
      setIsUploadingPicture(false);
    }
  };

  // Role-specific state (initially empty, loaded from backend)
  const [mentorExtras, setMentorExtras] = useState({
    services: [] as string[],
    industries: [] as string[],
    formats: [] as string[],
  });
  const [menteeExtras, setMenteeExtras] = useState({
    currentLevel: "",
    targetRole: "",
    learningStyle: "",
    goals: [] as string[],
    interests: [] as string[],
    portfolioLinks: [] as string[],
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

      const response = await fetch(API_ENDPOINTS.PROFILE, {
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
    <div className="flex-1 bg-muted/30 min-h-screen relative overflow-hidden">
      {/* Hero Background */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-hero opacity-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-24 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20 backdrop-blur-sm">
              {profile.role === "mentor" ? "✨ Mentor Profile" : "🎓 Student Profile"}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-2">
              <span className="text-gradient">Profile Management</span>
            </h1>
            <p className="text-lg text-muted-foreground/80 max-w-2xl font-medium">
              Manage your personal information, privacy settings, and professional portfolio.
            </p>
          </div>
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="bg-background/50 backdrop-blur-sm hover:bg-background/80"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-premium shadow-lg shadow-primary/25 text-white"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="btn-premium shadow-lg shadow-primary/25 text-white"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Profile Photo & Basic Info */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="glass-card border-none overflow-hidden relative group h-fit">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="text-center pb-2 relative z-10">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110"></div>
                  <Avatar className="w-40 h-40 mx-auto border-4 border-background shadow-xl relative">
                    <AvatarImage src={profile.profilePicture ? `${API_BASE_URL}${profile.profilePicture}` : undefined} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary font-bold">
                      {profile.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-2 right-2 flex space-x-2">
                    <input
                      type="file"
                      id="profile-picture-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureUpload}
                      disabled={isUploadingPicture}
                    />
                    <Button
                      size="icon"
                      className="rounded-full h-10 w-10 shadow-lg btn-premium transition-transform hover:scale-110 text-white"
                      onClick={() => document.getElementById('profile-picture-upload')?.click()}
                      disabled={isUploadingPicture}
                    >
                      <Camera className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {profile.profilePicture && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:text-destructive/90 hover:bg-destructive/10 -mt-2 mb-2"
                    onClick={handleDeleteProfilePicture}
                    disabled={isUploadingPicture}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove Photo
                  </Button>
                )}

                <CardTitle className="mt-4 text-2xl font-bold">{profile.name}</CardTitle>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20">
                    {profile.role === "mentor" ? "Mentor" : "Mentee"}
                  </Badge>
                  {profile.role === "mentor" && (
                    <Badge variant="outline" className="border-primary/20">
                      <Clock className="h-3 w-3 mr-1" />
                      {profile.hourlyRate ? `${profile.hourlyRate}/hr` : "Rate not set"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10 pt-4">
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors flex items-center gap-3 group/item">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email</p>
                      <p className="text-sm font-medium truncate">{profile.email}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors flex items-center gap-3 group/item">
                    <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary group-hover/item:scale-110 transition-transform">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Phone</p>
                      <p className="text-sm font-medium truncate">{profile.phone || "Not set"}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors flex items-center gap-3 group/item">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover/item:scale-110 transition-transform">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Location</p>
                      <p className="text-sm font-medium truncate">{profile.location || "Not set"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-8 space-y-6">
            {/* Personal Information */}
            <Card className="glass-card border-none">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="flex items-center text-xl">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mr-3">
                    <User className="h-5 w-5" />
                  </div>
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-muted-foreground ml-1">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    disabled={!isEditing}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-muted-foreground ml-1">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled={!isEditing}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-muted-foreground ml-1">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    disabled={!isEditing}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium text-muted-foreground ml-1">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    disabled={!isEditing}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium text-muted-foreground ml-1">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    disabled={!isEditing}
                    rows={4}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    className="bg-background/50 border-input/50 focus:bg-background transition-colors resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            {profile.role === "mentor" && (
              <Card className="glass-card border-none">
                <CardHeader className="pb-4 border-b border-border/50">
                  <CardTitle className="flex items-center text-xl">
                    <div className="p-2 rounded-lg bg-secondary/10 text-secondary mr-3">
                      <Award className="h-5 w-5" />
                    </div>
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-medium text-muted-foreground ml-1">Company</Label>
                    <Input
                      id="company"
                      value={profile.company}
                      disabled={!isEditing}
                      onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                      className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-sm font-medium text-muted-foreground ml-1">Position</Label>
                    <Input
                      id="position"
                      value={profile.position}
                      disabled={!isEditing}
                      onChange={(e) => setProfile(prev => ({ ...prev, position: e.target.value }))}
                      className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-sm font-medium text-muted-foreground ml-1">Experience</Label>
                    <Select
                      value={profile.experience}
                      disabled={!isEditing}
                      onValueChange={(value) => setProfile(prev => ({ ...prev, experience: value }))}
                    >
                      <SelectTrigger className="bg-background/50 border-input/50 focus:bg-background transition-colors">
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
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate" className="text-sm font-medium text-muted-foreground ml-1">Hourly Rate</Label>
                    <Input
                      id="hourlyRate"
                      value={profile.hourlyRate}
                      disabled={!isEditing}
                      onChange={(e) => setProfile(prev => ({ ...prev, hourlyRate: e.target.value }))}
                      className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="education" className="text-sm font-medium text-muted-foreground ml-1">Education</Label>
                    <Input
                      id="education"
                      value={profile.education}
                      disabled={!isEditing}
                      onChange={(e) => setProfile(prev => ({ ...prev, education: e.target.value }))}
                      className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mentor: Services, Industries, Formats */}
            {profile.role === "mentor" && (
              <Card className="glass-card border-none">
                <CardHeader className="pb-4 border-b border-border/50">
                  <CardTitle className="flex items-center text-xl">
                    <div className="p-2 rounded-lg bg-accent/10 text-accent mr-3">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    Mentoring Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground ml-1">Services Offered</Label>
                    <div className="flex flex-wrap gap-2 mb-3 mt-3">
                      {mentorExtras.services.map((s) => (
                        <Badge key={s} variant="secondary" className="px-3 py-1 bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20 transition-colors">
                          {s}
                          {isEditing && (
                            <Button variant="ghost" size="sm" className="ml-2 h-4 w-4 p-0 hover:text-destructive" onClick={() => removeService(s)}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Add service"
                          value={newService}
                          onChange={(e) => setNewService(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addService()}
                          className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                        />
                        <Button onClick={addService} size="icon" variant="outline" className="border-secondary/20 text-secondary hover:bg-secondary/10"><Plus className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground ml-1">Industries</Label>
                    <div className="flex flex-wrap gap-2 mb-3 mt-3">
                      {mentorExtras.industries.map((s) => (
                        <Badge key={s} variant="outline" className="px-3 py-1 border-primary/20 text-primary hover:bg-primary/5 transition-colors">
                          {s}
                          {isEditing && (
                            <Button variant="ghost" size="sm" className="ml-2 h-4 w-4 p-0 hover:text-destructive" onClick={() => removeIndustry(s)}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Add industry"
                          value={newIndustry}
                          onChange={(e) => setNewIndustry(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addIndustry()}
                          className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                        />
                        <Button onClick={addIndustry} size="icon" variant="outline" className="border-primary/20 text-primary hover:bg-primary/10"><Plus className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground ml-1">Mentoring Formats</Label>
                    <div className="flex flex-wrap gap-2 mb-3 mt-3">
                      {mentorExtras.formats.map((s) => (
                        <Badge key={s} variant="secondary" className="px-3 py-1 bg-accent/10 text-accent border-accent/20 hover:bg-accent/20 transition-colors">
                          {s}
                          {isEditing && (
                            <Button variant="ghost" size="sm" className="ml-2 h-4 w-4 p-0 hover:text-destructive" onClick={() => removeFormat(s)}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Add format"
                          value={newFormat}
                          onChange={(e) => setNewFormat(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addFormat()}
                          className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                        />
                        <Button onClick={addFormat} size="icon" variant="outline" className="border-accent/20 text-accent hover:bg-accent/10"><Plus className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            <Card className="glass-card border-none">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="flex items-center text-xl">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mr-3">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  Skills & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                      {skill}
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-4 w-4 p-0 hover:text-destructive"
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
                      className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                    />
                    <Button onClick={addSkill} size="icon" variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Availability */}
            {profile.role === "mentor" && (
              <Card className="glass-card border-none">
                <CardHeader className="pb-4 border-b border-border/50">
                  <CardTitle className="flex items-center text-xl">
                    <div className="p-2 rounded-lg bg-green-500/10 text-green-500 mr-3">
                      <Clock className="h-5 w-5" />
                    </div>
                    Availability
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    {profile.availability.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {profile.availability.map((slot, idx) => (
                          <div key={`${slot}-${idx}`} className="flex items-center justify-between p-3 bg-background/40 hover:bg-background/60 border border-border/50 rounded-xl transition-all">
                            <span className="text-sm font-medium">{slot}</span>
                            {isEditing && (
                              <Button variant="ghost" size="sm" onClick={() => removeAvailability(slot)} className="hover:text-destructive h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No availability set</p>
                    )}
                  </div>

                  {isEditing && (
                    <div className="bg-background/30 rounded-xl p-4 border border-border/50 mt-4">
                      <Label className="text-sm font-semibold mb-3 block">Add New Slot</Label>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Day</Label>
                          <Select value={newAvailabilityDay} onValueChange={setNewAvailabilityDay}>
                            <SelectTrigger className="bg-background/50 border-input/50 focus:bg-background transition-colors">
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
                          <Label className="text-xs text-muted-foreground">Start</Label>
                          <Input type="time" value={newAvailabilityStart} onChange={(e) => setNewAvailabilityStart(e.target.value)} className="bg-background/50 border-input/50 focus:bg-background transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">End</Label>
                          <Input type="time" value={newAvailabilityEnd} onChange={(e) => setNewAvailabilityEnd(e.target.value)} className="bg-background/50 border-input/50 focus:bg-background transition-colors" />
                        </div>
                        <div>
                          <Button onClick={addAvailability} className="w-full btn-premium shadow-md text-white">
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Languages */}
            <Card className="glass-card border-none">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="flex items-center text-xl">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 mr-3">
                    <Languages className="h-5 w-5" />
                  </div>
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.languages.map((language, index) => (
                    <Badge key={index} variant="outline" className="px-3 py-1 border-orange-500/20 text-orange-600 bg-orange-500/5">
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
                      className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                    />
                    <Button onClick={addLanguage} size="icon" variant="outline" className="border-orange-500/20 text-orange-500 hover:bg-orange-500/10">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certifications */}
            {profile.role === "mentor" && (
              <Card className="glass-card border-none">
                <CardHeader className="pb-4 border-b border-border/50">
                  <CardTitle className="flex items-center text-xl">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary mr-3">
                      <Award className="h-5 w-5" />
                    </div>
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3 mb-4">
                    {profile.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-background/40 hover:bg-background/60 border border-border/50 rounded-xl transition-all">
                        <span className="font-medium text-sm">{cert}</span>
                        {isEditing && (
                          <Button variant="ghost" size="sm" className="hover:text-destructive h-8 w-8 p-0">
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
                        className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                      />
                      <Button onClick={addCertification} size="icon" variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Mentee: Learning Profile */}
            {profile.role !== "mentor" && (
              <Card className="glass-card border-none">
                <CardHeader className="pb-4 border-b border-border/50">
                  <CardTitle className="flex items-center text-xl">
                    <div className="p-2 rounded-lg bg-accent/10 text-accent mr-3">
                      <TargetIcon className="h-5 w-5" />
                    </div>
                    Learning Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentLevel" className="text-sm font-medium text-muted-foreground ml-1">Current Level</Label>
                      <Select value={menteeExtras.currentLevel} disabled={!isEditing} onValueChange={(v) => setMenteeExtras(prev => ({ ...prev, currentLevel: v }))}>
                        <SelectTrigger id="currentLevel" className="bg-background/50 border-input/50 focus:bg-background transition-colors">
                          <SelectValue placeholder="Select your level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetRole" className="text-sm font-medium text-muted-foreground ml-1">Target Role</Label>
                      <Input
                        id="targetRole"
                        placeholder="e.g. Full Stack Developer"
                        value={menteeExtras.targetRole}
                        disabled={!isEditing}
                        onChange={(e) => setMenteeExtras(prev => ({ ...prev, targetRole: e.target.value }))}
                        className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground ml-1">Learning Goals</Label>
                    <div className="flex flex-wrap gap-2 mb-3 mt-3">
                      {menteeExtras.goals.map((g) => (
                        <Badge key={g} variant="secondary" className="px-3 py-1 bg-accent/10 text-accent border-accent/20 hover:bg-accent/20 transition-colors">
                          {g}
                          {isEditing && (
                            <Button variant="ghost" size="sm" className="ml-2 h-4 w-4 p-0 hover:text-destructive" onClick={() => removeGoal(g)}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Add learning goal (e.g. Learn React)"
                          value={newGoal}
                          onChange={(e) => setNewGoal(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                          className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                        />
                        <Button onClick={addGoal} size="icon" variant="outline" className="border-accent/20 text-accent hover:bg-accent/10"><Plus className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground ml-1">Interests</Label>
                    <div className="flex flex-wrap gap-2 mb-3 mt-3">
                      {menteeExtras.interests.map((i) => (
                        <Badge key={i} variant="outline" className="px-3 py-1 border-primary/20 text-primary hover:bg-primary/5 transition-colors">
                          {i}
                          {isEditing && (
                            <Button variant="ghost" size="sm" className="ml-2 h-4 w-4 p-0 hover:text-destructive" onClick={() => removeInterest(i)}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </Badge>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Add interest (e.g. Web Development)"
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                          className="bg-background/50 border-input/50 focus:bg-background transition-colors"
                        />
                        <Button onClick={addInterest} size="icon" variant="outline" className="border-primary/20 text-primary hover:bg-primary/10"><Plus className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;