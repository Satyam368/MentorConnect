import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Calendar, MessageCircle, Star, Users, Clock, Edit, Check, X, Upload, Link2, File, Download, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";

const MentorDashboard = () => {
  const navigate = useNavigate();
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

  // Get current user for socket connection
  const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
  const { socket } = useSocket(authUser?.email);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);
  const [shareTitle, setShareTitle] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [shareDescription, setShareDescription] = useState("");
  const [shareCategory, setShareCategory] = useState<string | undefined>(undefined);

  // Resources state
  const [resources, setResources] = useState<any[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);

  // Expertise options
  const expertiseOptions = [
    "Web Development",
    "Mobile Development",
    "Data Science",
    "Machine Learning",
    "Artificial Intelligence",
    "DevOps",
    "Cloud Computing",
    "Cybersecurity",
    "Blockchain",
    "UI/UX Design",
    "Product Management",
    "Digital Marketing",
    "Game Development",
    "IoT",
    "Other"
  ];
  const [selectedExpertise, setSelectedExpertise] = useState("");
  const [customExpertise, setCustomExpertise] = useState("");

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
            const profileResponse = await fetch(API_ENDPOINTS.PROFILE_BY_EMAIL(user.email));
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

              // Initialize expertise dropdown
              const expertise = profileData.user.company || "";
              if (expertiseOptions.includes(expertise)) {
                setSelectedExpertise(expertise);
              } else if (expertise) {
                setSelectedExpertise("Other");
                setCustomExpertise(expertise);
              }

              // Update stats from profile
              if (profileData.user.mentor) {
                setStats({
                  activeStudents: profileData.user.mentor.activeStudents || 0,
                  totalSessions: profileData.user.mentor.totalSessions || 0,
                  averageRating: profileData.user.mentor.averageRating || 0,
                  totalReviews: profileData.user.mentor.totalReviews || 0
                });
              }

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

  // Listen for real-time updates when session requests are created
  useEffect(() => {
    if (!socket || !authUser?.id) return;

    console.log('🔊 Setting up session request listener in MentorDashboard');

    const handleNewSessionRequest = (data: any) => {
      console.log('📢 New session request received:', data);

      // Show notification to mentor
      toast({
        title: "New Session Request!",
        description: `You have a new session request for ${data.sessionType}.`,
      });

      // Refresh the session requests list
      const loadSessionRequests = async () => {
        try {
          const url = API_ENDPOINTS.BOOKINGS_BY_MENTOR_ID(authUser.id);
          const response = await fetch(url);

          if (response.ok) {
            const bookings = await response.json();
            const pendingRequests = bookings.filter((booking: any) => booking.status === 'pending');
            setSessionRequests(pendingRequests);
          }
        } catch (error) {
          console.error('Error refreshing session requests:', error);
        }
      };

      loadSessionRequests();
    };

    socket.on('new-session-request', handleNewSessionRequest);

    return () => {
      console.log('🧹 Cleaning up session request listener');
      socket.off('new-session-request', handleNewSessionRequest);
    };
  }, [socket, authUser, toast]);

  // Load session requests from API
  useEffect(() => {
    const loadSessionRequests = async () => {
      try {
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
        console.log('MentorDashboard - Loading session requests for mentor ID:', authUser.id);

        if (!authUser.id) {
          console.log('MentorDashboard - No auth user ID found');
          setSessionRequests([]);
          setLoadingRequests(false);
          return;
        }

        const url = API_ENDPOINTS.BOOKINGS_BY_MENTOR_ID(authUser.id);
        console.log('MentorDashboard - Fetching from URL:', url);

        const response = await fetch(url);
        console.log('MentorDashboard - Response status:', response.status);

        if (response.ok) {
          const bookings = await response.json();
          console.log('MentorDashboard - All bookings received:', bookings);

          // Filter for pending bookings only (session requests)
          const pendingRequests = bookings.filter((booking: any) => booking.status === 'pending');
          console.log('MentorDashboard - Pending requests:', pendingRequests);
          setSessionRequests(pendingRequests);
        } else {
          console.log('MentorDashboard - Response not OK, status:', response.status);
          setSessionRequests([]);
        }
      } catch (error) {
        console.error('MentorDashboard - Error loading session requests:', error);
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

  // Load resources on component mount
  useEffect(() => {
    fetchResources();
  }, []);

  // Dynamic upcoming sessions state
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Stats state
  const [stats, setStats] = useState({
    activeStudents: 0,
    totalSessions: 0,
    averageRating: 0,
    totalReviews: 0
  });

  // Load upcoming sessions from API
  useEffect(() => {
    const loadUpcomingSessions = async () => {
      try {
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
        if (!authUser.id) {
          setUpcomingSessions([]);
          setLoadingSessions(false);
          return;
        }

        const response = await fetch(API_ENDPOINTS.BOOKINGS_BY_MENTOR_ID(authUser.id));
        if (response.ok) {
          const bookings = await response.json();
          console.log('MentorDashboard - All bookings for upcoming sessions:', bookings);

          // Filter for CONFIRMED upcoming sessions only
          const now = new Date();
          const upcoming = bookings
            .filter((booking: any) =>
              booking.status === 'confirmed' &&
              new Date(booking.date) >= now
            )
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5);

          console.log('MentorDashboard - Confirmed upcoming sessions:', upcoming);
          setUpcomingSessions(upcoming);
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
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      if (!authUser.id) {
        setSessionRequests([]);
        setLoadingRequests(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.BOOKINGS_BY_MENTOR_ID(authUser.id));
      if (response.ok) {
        const bookings = await response.json();
        const pendingRequests = bookings.filter((booking: any) => booking.status === 'pending');
        setSessionRequests(pendingRequests);
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
      const authUser = JSON.parse(localStorage.getItem("authUser") || "{}");
      if (!authUser.id) {
        setUpcomingSessions([]);
        setLoadingSessions(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.BOOKINGS_BY_MENTOR_ID(authUser.id));
      if (response.ok) {
        const bookings = await response.json();
        const now = new Date();
        const upcoming = bookings
          .filter((booking: any) =>
            booking.status === 'confirmed' &&
            new Date(booking.date) >= now
          )
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5);
        setUpcomingSessions(upcoming);
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

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Store reference to the input element before async operations
    const inputElement = e.currentTarget;

    const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
    if (!userData) {
      toast({ title: "Error", description: "User session not found.", variant: "destructive" });
      inputElement.value = "";
      return;
    }

    const user = JSON.parse(userData);

    // Upload each file
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('description', `Uploaded file: ${file.name}`);
      formData.append('category', 'other');
      formData.append('mentorEmail', user.email);
      formData.append('mentorName', user.name);

      // Only append mentorId if it exists and is valid
      if (user._id) {
        formData.append('mentorId', user._id);
      }

      try {
        const response = await fetch(API_ENDPOINTS.RESOURCE_UPLOAD, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        return { success: true, fileName: file.name };
      } catch (error) {
        return { success: false, fileName: file.name, error };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
      toast({
        title: "Files uploaded!",
        description: `${successCount} file(s) uploaded successfully.${failCount > 0 ? ` ${failCount} failed.` : ''}`
      });
      fetchResources(); // Refresh the resources list
    } else {
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive"
      });
    }

    // Reset the input value using the stored reference
    if (inputElement) {
      inputElement.value = "";
    }
  };

  // Fetch mentor's resources
  const fetchResources = async () => {
    const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
    if (!userData) return;

    const user = JSON.parse(userData);
    if (!user.email) return;

    setIsLoadingResources(true);
    try {
      const response = await fetch(API_ENDPOINTS.RESOURCE_BY_MENTOR(user.email));
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setIsLoadingResources(false);
    }
  };

  // Delete a resource
  const handleDeleteResource = async (resourceId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.RESOURCE_DELETE(resourceId), {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({ title: "Resource deleted!", description: "The resource has been removed successfully." });
        fetchResources(); // Refresh the list
      } else {
        throw new Error("Failed to delete resource");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete resource.", variant: "destructive" });
    }
  };

  // Download a file resource
  const handleDownloadFile = (resourceId: string, fileName: string) => {
    const downloadUrl = API_ENDPOINTS.RESOURCE_DOWNLOAD(resourceId);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareLink = async () => {
    if (!shareTitle || !shareUrl) {
      toast({ title: "Missing details", description: "Please provide a title and a valid URL.", variant: "destructive" });
      return;
    }

    const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
    if (!userData) {
      toast({ title: "Error", description: "User session not found.", variant: "destructive" });
      return;
    }

    const user = JSON.parse(userData);

    // Prepare the request body
    const requestBody: any = {
      title: shareTitle,
      url: shareUrl,
      description: shareDescription,
      category: shareCategory,
      type: 'link',
      mentorEmail: user.email,
      mentorName: user.name
    };

    // Only add mentorId if it exists
    if (user._id) {
      requestBody.mentorId = user._id;
    }

    try {
      const res = await fetch(API_ENDPOINTS.RESOURCE_CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        toast({ title: "Link shared!", description: `${shareTitle} has been shared successfully.` });
        setShareTitle("");
        setShareUrl("");
        setShareDescription("");
        setShareCategory(undefined);
        fetchResources(); // Refresh the resources list
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

  const handleSessionRequest = async (requestId: string, action: "accept" | "decline") => {
    try {
      const newStatus = action === "accept" ? "confirmed" : "cancelled";

      const response = await fetch(API_ENDPOINTS.BOOKING_UPDATE_STATUS(requestId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Refresh both session requests and upcoming sessions
        await refreshSessionRequests();
        if (action === "accept") {
          await refreshUpcomingSessions();
        }

        // Show simple success message
        toast({
          title: action === "accept" ? "Session accepted!" : "Session declined",
          description: action === "accept"
            ? "The session has been added to your Upcoming Sessions tab. The student will be notified."
            : "The student will be notified about your decision.",
        });

        // Update notification count for mentor (without triggering mentee notifications)
        setTimeout(() => {
          const notificationUpdateEvent = new CustomEvent('mentorNotificationUpdate');
          window.dispatchEvent(notificationUpdateEvent);
        }, 500);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update session request');
      }
    } catch (error) {
      console.error('Error updating session request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update session request",
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

  const addCertification = (certification: string) => {
    if (certification && !profile.certifications.includes(certification)) {
      setProfile(prev => ({
        ...prev,
        certifications: [...prev.certifications, certification]
      }));
    }
  };

  const removeCertification = (certToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert !== certToRemove)
    }));
  };

  const handleCertificateUpload = () => {
    certificateInputRef.current?.click();
  };

  const handleCertificateSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // For now, just add the filename to certifications list
    // In a full implementation, you would upload to server first
    const file = files[0];
    const certificateName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    addCertification(certificateName);

    toast({
      title: "Certificate added!",
      description: `${file.name} has been added to your certifications.`,
    });

    // Reset input
    event.target.value = "";
  };

  const handleExpertiseChange = (value: string) => {
    setSelectedExpertise(value);
    if (value !== "Other") {
      setProfile(prev => ({ ...prev, expertise: value }));
      setCustomExpertise("");
    }
  };

  const handleCustomExpertiseChange = (value: string) => {
    setCustomExpertise(value);
    setProfile(prev => ({ ...prev, expertise: value }));
  };

  // Helper function to check if session can be joined (10 minutes before start time)
  const canJoinSession = (sessionDate: string, sessionTime: string) => {
    const now = new Date();

    // Parse the session date properly
    const sessionDateObj = new Date(sessionDate);
    const [hours, minutes] = sessionTime.split(':');

    // Create session datetime by combining date and time
    const sessionDateTime = new Date(sessionDateObj);
    sessionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Calculate time difference in minutes
    const timeDiff = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60);

    // Allow joining 10 minutes before and up to 30 minutes after start time
    return timeDiff <= 10 && timeDiff >= -30;
  };

  // Helper function to get session status message
  const getSessionTimeStatus = (sessionDate: string, sessionTime: string) => {
    const now = new Date();

    // Parse the session date properly
    const sessionDateObj = new Date(sessionDate);
    const [hours, minutes] = sessionTime.split(':');

    // Create session datetime by combining date and time
    const sessionDateTime = new Date(sessionDateObj);
    sessionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const timeDiff = (sessionDateTime.getTime() - now.getTime()) / (1000 * 60);

    if (timeDiff < -30) return "Ended";
    if (timeDiff <= 0) return "In Progress";
    if (timeDiff <= 10) return "Starting Soon";

    const totalHours = Math.floor(timeDiff / 60);
    const remainingMinutes = Math.floor(timeDiff % 60);

    // If more than 24 hours away, show days
    if (totalHours >= 24) {
      const days = Math.floor(totalHours / 24);
      const hoursLeft = totalHours % 24;
      if (hoursLeft > 0) return `Starts in ${days}d ${hoursLeft}h`;
      return `Starts in ${days}d`;
    }

    if (totalHours > 0) return `Starts in ${totalHours}h ${remainingMinutes}m`;
    return `Starts in ${remainingMinutes}m`;
  };

  // Handle join session
  const handleJoinSession = (session: any) => {
    // Create a unique room ID based on session details
    const roomId = `session_${session._id || session.id}`;

    // In a real implementation, you would:
    // 1. Integrate with a video conferencing service (Zoom, Google Meet, Jitsi, etc.)
    // 2. Generate/retrieve a meeting link
    // 3. Update session status to 'in-progress'

    // For now, we'll use a simple approach with a query parameter
    const meetingUrl = `/video-call?room=${roomId}&name=${encodeURIComponent(profile.name)}&type=mentor`;

    toast({
      title: "Joining Session",
      description: `Starting video call with ${session.user?.name || 'student'}...`,
    });

    // Open in new tab or navigate
    window.open(meetingUrl, '_blank');
  };

  const handleProfileUpdate = async () => {
    try {
      console.log('handleProfileUpdate called');
      console.log('Current profile state:', profile);

      // Get user data from localStorage to include email
      const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
      let userEmail = "";
      if (userData) {
        const user = JSON.parse(userData);
        userEmail = user.email || "";
      }

      console.log('User email:', userEmail);

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

      console.log('Sending profile data:', profileData);

      const res = await fetch(API_ENDPOINTS.PROFILE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      console.log('Response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('Response data:', data);
        toast({ title: "Profile updated!", description: data.message });

        // Update localStorage with the new user data
        const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          const updatedUser = { ...user, name: profile.name };
          localStorage.setItem('authUser', JSON.stringify(updatedUser));
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-12 pt-24 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-hero opacity-10 pointer-events-none"></div>
      <div className="absolute top-20 right-0 -mr-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 pointer-events-none animate-pulse"></div>
      <div className="absolute top-40 left-0 -ml-20 w-72 h-72 bg-secondary/20 rounded-full blur-3xl opacity-20 pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Dashboard Header */}
        <div className="mb-10 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <Badge variant="outline" className="mb-3 bg-primary/10 text-primary border-primary/20 backdrop-blur-sm">
                ✨ Mentor Dashboard
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Welcome back, <span className="text-gradient">{profile.name.split(' ')[0]}</span>
              </h1>
              <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
                Manage your mentoring sessions, track your impact, and share resources with your students.
              </p>
            </div>
            {!profile.availability && (
              <div className="flex items-center text-destructive bg-destructive/10 px-4 py-2 rounded-xl border border-destructive/20 backdrop-blur-sm">
                <Clock className="h-5 w-5 mr-3" />
                <span className="font-medium">You are currently set as unavailable</span>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card border-none p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-primary/5 text-primary">Active</Badge>
              </div>
              <div>
                <h3 className="text-3xl font-bold">{stats.activeStudents}</h3>
                <p className="text-sm text-muted-foreground mt-1">Active Students</p>
              </div>
            </Card>

            <Card className="glass-card border-none p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
                  <Video className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-secondary/5 text-secondary">Total</Badge>
              </div>
              <div>
                <h3 className="text-3xl font-bold">{stats.totalSessions}</h3>
                <p className="text-sm text-muted-foreground mt-1">Sessions Completed</p>
              </div>
            </Card>

            <Card className="glass-card border-none p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-accent/10 text-accent">
                  <Star className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-accent/5 text-accent">Rating</Badge>
              </div>
              <div>
                <h3 className="text-3xl font-bold">{stats.averageRating ? stats.averageRating.toFixed(1) : "N/A"}</h3>
                <p className="text-sm text-muted-foreground mt-1">Average Rating ({stats.totalReviews})</p>
              </div>
            </Card>

            <Card className="glass-card border-none p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
                  <Clock className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-green-500/5 text-green-500">Pending</Badge>
              </div>
              <div>
                <h3 className="text-3xl font-bold">{sessionRequests.length}</h3>
                <p className="text-sm text-muted-foreground mt-1">Session Requests</p>
              </div>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="requests" className="space-y-8">
          <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-4 p-1 bg-background/50 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-full">
            <TabsTrigger value="requests" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all relative">
              Requests
              {sessionRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white text-[10px] font-bold shadow-sm ring-2 ring-background animate-pulse">
                  {sessionRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="schedule" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
              Schedule
            </TabsTrigger>
            <TabsTrigger value="resources" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
              Resources
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6 animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
            <Card className="glass-card border-none">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="flex items-center text-xl">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mr-3">
                    <Users className="h-5 w-5" />
                  </div>
                  Session Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {loadingRequests ? (
                  <div className="text-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading requests...</p>
                  </div>
                ) : sessionRequests.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {sessionRequests.map((request) => (
                      <div key={request._id || request.id} className="group relative overflow-hidden border border-border/50 rounded-2xl p-5 bg-background/50 hover:bg-background/80 transition-all duration-300 hover:shadow-md">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-300"></div>
                        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-12 w-12 border-2 border-primary/10 group-hover:border-primary/50 transition-colors">
                              <AvatarImage src={request.user?.image} />
                              <AvatarFallback className="bg-primary/10 text-primary">{request.user?.name?.[0] || "S"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-lg text-foreground">
                                {request.user?.name || "Student"}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Badge variant="secondary" className="bg-secondary/10 text-secondary border-none">
                                  {request.sessionType.replace('-', ' ').toUpperCase()}
                                </Badge>
                                <span>•</span>
                                <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {request.duration}</span>
                              </div>
                              <div className="mt-2 flex items-center text-sm font-medium text-primary bg-primary/5 w-fit px-3 py-1 rounded-full">
                                <Calendar className="h-3 w-3 mr-2" />
                                {new Date(request.date).toLocaleDateString()} at {request.time}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-foreground mb-1">${request.cost}</div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Cost</p>
                          </div>
                        </div>

                        {request.notes && (
                          <div className="mt-4 p-3 bg-muted/30 rounded-xl text-sm italic text-muted-foreground border border-border/50">
                            "{request.notes}"
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-primary/10 hover:text-primary rounded-full"
                            onClick={() => window.location.href = `/chat?user=${request.user?.email || ''}`}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSessionRequest(request._id || request.id, "decline")}
                              className="bg-transparent border-destructive/20 text-destructive hover:bg-destructive/10 rounded-full"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                            <Button
                              onClick={() => handleSessionRequest(request._id || request.id, "accept")}
                              className="bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Accept Request
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 px-4 rounded-2xl bg-muted/20 border border-dashed border-border">
                    <div className="bg-background rounded-full p-4 w-fit mx-auto mb-4 shadow-sm">
                      <Users className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">No pending requests</h3>
                    <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                      When students request a session with you, they will appear here for your approval.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Sessions */}
          <TabsContent value="schedule" className="space-y-6 animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
            <Card className="glass-card border-none">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="flex items-center text-xl">
                  <div className="p-2 rounded-lg bg-secondary/10 text-secondary mr-3">
                    <Calendar className="h-5 w-5" />
                  </div>
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {loadingSessions ? (
                  <div className="text-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-secondary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading upcoming sessions...</p>
                  </div>
                ) : upcomingSessions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {upcomingSessions.map(session => {
                      const canJoin = canJoinSession(session.date, session.time);
                      const timeStatus = getSessionTimeStatus(session.date, session.time);

                      return (
                        <div key={session._id || session.id} className={`group relative overflow-hidden border border-border/50 rounded-2xl p-5 bg-background/50 hover:bg-background/80 transition-all duration-300 hover:shadow-md ${canJoin ? 'ring-2 ring-primary/20 shadow-lg shadow-primary/5' : ''}`}>
                          <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-300 ${canJoin ? 'bg-green-500' : 'bg-secondary/0 group-hover:bg-secondary'}`}></div>

                          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <div className="absolute inset-0 bg-secondary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative text-3xl bg-secondary/10 p-3 rounded-2xl">👨‍🎓</div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-lg text-foreground">
                                    {session.user?.name || "Student"}
                                  </h4>
                                  {canJoin && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <Badge variant="secondary" className="bg-secondary/10 text-secondary border-none">
                                    {session.sessionType.replace('-', ' ').toUpperCase()}
                                  </Badge>
                                  <span>•</span>
                                  <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {timeStatus}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-foreground">
                                {new Date(session.date).toLocaleDateString()}
                              </div>
                              <div className="text-sm font-medium text-primary bg-primary/5 px-2 py-1 rounded-md inline-block mt-1">
                                {session.time}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">${session.cost}</p>
                            </div>
                          </div>

                          {session.notes && (
                            <div className="mt-4 p-3 bg-muted/30 rounded-xl text-sm italic text-muted-foreground border border-border/50">
                              "{session.notes}"
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <span className="w-2 h-2 rounded-full bg-slate-300 mr-2"></span>
                              Student Email: {session.user?.email || "N/A"}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-primary/10 hover:text-primary rounded-full"
                                onClick={() => window.location.href = `/chat?user=${session.user?.email || ''}`}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Message
                              </Button>
                              {canJoin ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleJoinSession(session)}
                                  className="btn-premium shadow-lg shadow-primary/25 animate-pulse rounded-full pl-3 pr-4"
                                >
                                  <Video className="h-4 w-4 mr-2" />
                                  Join Session
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled
                                  className="opacity-70 rounded-full"
                                >
                                  <Video className="h-4 w-4 mr-2" />
                                  Join Session
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 px-4 rounded-2xl bg-muted/20 border border-dashed border-border">
                    <div className="bg-background rounded-full p-4 w-fit mx-auto mb-4 shadow-sm">
                      <Calendar className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">No upcoming sessions</h3>
                    <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                      Confirmed sessions will appear here. Get ready to mentor!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Management */}
          <TabsContent value="profile" className="space-y-6 animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
            <Card className="glass-card border-none">
              <CardHeader className="border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary mr-3">
                      <Edit className="h-5 w-5" />
                    </div>
                    Profile Management
                  </CardTitle>
                  <div className="flex items-center space-x-3 bg-background/50 px-3 py-1.5 rounded-full border border-border/50">
                    <Label htmlFor="availability" className="cursor-pointer text-sm font-medium">Available for sessions</Label>
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
              <CardContent className="space-y-8 pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-base font-semibold">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                      className="h-11 bg-background/50 border-input/50 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="expertise" className="text-base font-semibold">Primary Expertise</Label>
                    {isEditing ? (
                      <div className="space-y-3">
                        <Select
                          value={selectedExpertise || profile.expertise}
                          onValueChange={handleExpertiseChange}
                        >
                          <SelectTrigger className="h-11 bg-background/50 border-input/50 focus:bg-background transition-colors">
                            <SelectValue placeholder="Select your expertise" />
                          </SelectTrigger>
                          <SelectContent>
                            {expertiseOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(selectedExpertise === "Other" || (!selectedExpertise && !expertiseOptions.includes(profile.expertise))) && (
                          <Input
                            placeholder="Enter your expertise"
                            value={customExpertise || profile.expertise}
                            onChange={(e) => handleCustomExpertiseChange(e.target.value)}
                            className="h-11 bg-background/50 border-input/50 focus:bg-background transition-colors"
                          />
                        )}
                      </div>
                    ) : (
                      <Input
                        id="expertise"
                        value={profile.expertise}
                        disabled={true}
                        className="h-11 bg-muted/50 border-transparent text-muted-foreground"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="bio" className="text-base font-semibold">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isEditing}
                    rows={4}
                    className="bg-background/50 border-input/50 focus:bg-background transition-colors resize-none p-4"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold">Skills & Competencies</Label>
                  <div className="p-4 rounded-xl bg-background/30 border border-border/50 min-h-[100px]">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {profile.skills.map(skill => (
                        <Badge key={skill} variant="secondary" className="pl-3 pr-2 py-1.5 bg-secondary/10 text-secondary border-none hover:bg-secondary/20 transition-colors">
                          {skill}
                          {isEditing && (
                            <button
                              onClick={() => removeSkill(skill)}
                              className="ml-2 hover:bg-destructive/20 hover:text-destructive rounded-full p-0.5 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                      {profile.skills.length === 0 && (
                        <span className="text-muted-foreground italic text-sm">No skills added yet</span>
                      )}
                    </div>
                    {isEditing && (
                      <div className="flex gap-2 max-w-md">
                        <Input
                          placeholder="Type a skill and press Enter"
                          className="bg-background/80"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSkill(e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Certifications</Label>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCertificateUpload}
                        className="h-8 text-xs border-primary/20 text-primary hover:bg-primary/5"
                      >
                        <Upload className="h-3 w-3 mr-2" />
                        Upload Certificate
                      </Button>
                    )}
                  </div>
                  <div className="p-4 rounded-xl bg-background/30 border border-border/50 min-h-[100px]">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {profile.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="pl-3 pr-2 py-1.5 border-primary/20 bg-primary/5 text-primary">
                          {cert}
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => removeCertification(cert)}
                              className="ml-2 hover:bg-destructive/10 hover:text-destructive rounded-full p-0.5 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                      {profile.certifications.length === 0 && (
                        <span className="text-muted-foreground italic text-sm">No certifications added yet</span>
                      )}
                    </div>
                    {isEditing && (
                      <div className="flex gap-2 max-w-md">
                        <Input
                          placeholder="Or type certificate name and press Enter"
                          className="bg-background/80"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCertification(e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    )}
                    <input
                      ref={certificateInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleCertificateSelect}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-border/50">
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="px-6"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleProfileUpdate}
                        className="btn-premium text-white px-8 shadow-lg shadow-primary/25"
                      >
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="btn-premium text-white px-8 shadow-lg shadow-primary/25"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources */}
          <TabsContent value="resources" className="space-y-6 animate-in fade-in-50 duration-500 slide-in-from-bottom-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Uploaded Resources List */}
              <Card className="glass-card border-none lg:col-span-2 h-fit">
                <CardHeader className="border-b border-border/50 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-xl">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary mr-3">
                        <File className="h-5 w-5" />
                      </div>
                      Your Shared Resources
                    </CardTitle>
                    <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10">{resources.length} Files</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoadingResources ? (
                    <div className="text-center py-12">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading resources...</p>
                    </div>
                  ) : resources.length === 0 ? (
                    <div className="text-center py-16 px-4 rounded-2xl bg-muted/20 border border-dashed border-border">
                      <div className="bg-background rounded-full p-4 w-fit mx-auto mb-4 shadow-sm">
                        <File className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">No resources shared yet</h3>
                      <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                        Share study materials and links with your students to help them succeed.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {resources.map((resource) => (
                        <div key={resource._id} className="group border border-border/50 rounded-xl p-4 bg-background/40 hover:bg-background/80 transition-all duration-300 hover:shadow-md">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`p-2 rounded-lg ${resource.type === 'link' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                  {resource.type === 'link' ? <Link2 className="h-4 w-4" /> : <File className="h-4 w-4" />}
                                </div>
                                <h4 className="font-semibold text-foreground truncate">{resource.title}</h4>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs bg-background/50">
                                  {resource.category}
                                </Badge>
                                {resource.type === 'file' && (
                                  <Badge variant="secondary" className="text-xs bg-secondary/10 text-secondary border-none">
                                    {resource.fileType?.split('/')[1]?.toUpperCase()}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {new Date(resource.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              {resource.description && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{resource.description}</p>
                              )}

                              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                                {resource.type === 'link' ? (
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                                  >
                                    Visit Link <Link2 className="h-3 w-3" />
                                  </a>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDownloadFile(resource._id, resource.fileName)}
                                      className="h-8 text-primary hover:bg-primary/10 hover:text-primary pl-0"
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                      {(resource.fileSize / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                  </div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteResource(resource._id)}
                                  className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <X className="h-4 w-4 mr-1" /> Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sidebar: Upload & Share */}
              <div className="space-y-6">
                <Card className="glass-card border-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <div className="p-2 rounded-lg bg-green-500/10 text-green-500 mr-3">
                        <Upload className="h-5 w-5" />
                      </div>
                      Upload File
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      onClick={handleUploadClick}
                      className="cursor-pointer group relative overflow-hidden rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-background/30 hover:bg-background/50 transition-all duration-300 p-8 text-center"
                    >
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative z-10">
                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <h4 className="font-medium text-foreground mb-1">Click to upload</h4>
                        <p className="text-xs text-muted-foreground">PDF, DOC, Images (Max 50MB)</p>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFilesSelected}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar,.mp4,.avi,.mov"
                    />
                  </CardContent>
                </Card>

                <Card className="glass-card border-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 mr-3">
                        <Link2 className="h-5 w-5" />
                      </div>
                      Share Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="shareTitle" className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Title</Label>
                      <Input id="shareTitle" placeholder="Resource title" value={shareTitle} onChange={(e) => setShareTitle(e.target.value)} className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shareUrl" className="text-xs uppercase text-muted-foreground font-bold tracking-wider">URL</Label>
                      <Input id="shareUrl" placeholder="https://" value={shareUrl} onChange={(e) => setShareUrl(e.target.value)} className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Category</Label>
                      <Select value={shareCategory} onValueChange={setShareCategory}>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Select type" />
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
                    <div className="space-y-2">
                      <Label htmlFor="shareDescription" className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Description</Label>
                      <Textarea id="shareDescription" rows={2} placeholder="Brief description..." value={shareDescription} onChange={(e) => setShareDescription(e.target.value)} className="resize-none bg-background/50" />
                    </div>
                    <Button onClick={handleShareLink} className="w-full btn-premium shadow-lg shadow-blue-500/20">
                      <Link2 className="h-4 w-4 mr-2" /> Share Link
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>

  );
};

export default MentorDashboard;