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
        
        // Refresh the profile data to show updated information
        await refreshProfileData();
        
        setIsEditing(false);
      } else {
        const errorData = await res.json();
        console.error('Server returned error:', errorData);
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to update profile", 
        variant: "destructive" 
      });
    }
  };

  // Function to refresh profile data
  const refreshProfileData = async () => {
    try {
      const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      if (!user.email) return;

      const profileResponse = await fetch(API_ENDPOINTS.PROFILE_BY_EMAIL(user.email));
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
                  <p className="text-2xl font-bold text-card-foreground">{stats.activeStudents}</p>
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
                  <p className="text-2xl font-bold text-card-foreground">{stats.totalSessions}</p>
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
                  <p className="text-2xl font-bold text-card-foreground">{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}</p>
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
                  <p className="text-2xl font-bold text-card-foreground">{stats.totalReviews}</p>
                  <p className="text-muted-foreground text-sm">Total Reviews</p>
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
                          <div className="text-2xl">👨‍💻</div>
                          <div>
                            <h4 className="font-semibold text-card-foreground">
                              {request.user?.name || "Student"}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {request.sessionType.replace('-', ' ').toUpperCase()} • {request.duration}
                            </p>
                            <p className="text-sm text-primary font-medium">
                              {new Date(request.date).toLocaleDateString()} at {request.time}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-card-foreground">${request.cost}</p>
                          <p className="text-xs text-muted-foreground">{request.duration}</p>
                        </div>
                      </div>
                      {request.notes && (
                        <p className="text-muted-foreground mb-4 leading-relaxed">"{request.notes}"</p>
                      )}
                      <div className="flex items-center space-x-3">
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.location.href = `/chat?user=${request.user?.email || ''}`}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
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
                  upcomingSessions.map(session => {
                    const canJoin = canJoinSession(session.date, session.time);
                    const timeStatus = getSessionTimeStatus(session.date, session.time);
                    
                    return (
                      <div key={session._id || session.id} className="border rounded-lg p-4 bg-muted/50 hover:bg-muted/70 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="text-2xl">👨‍🎓</div>
                            <div className="flex-1">
                              <p className="font-medium text-card-foreground">
                                {session.user?.name || "Student"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {session.sessionType.replace('-', ' ').toUpperCase()} • {session.duration}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant={session.status === "confirmed" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {session.status}
                                </Badge>
                                <Badge 
                                  variant={canJoin ? "destructive" : "outline"}
                                  className="text-xs"
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  {timeStatus}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-card-foreground">
                              {new Date(session.date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">{session.time}</p>
                            <p className="text-xs text-muted-foreground mt-1">${session.cost}</p>
                          </div>
                        </div>
                        
                        {session.notes && (
                          <p className="text-sm text-muted-foreground mb-3 p-2 bg-background/50 rounded border-l-2 border-primary">
                            "{session.notes}"
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            Student Email: {session.user?.email || "N/A"}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.location.href = `/chat?user=${session.user?.email || ''}`}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                            {canJoin ? (
                              <Button
                                variant="hero"
                                size="sm"
                                onClick={() => handleJoinSession(session)}
                                className="animate-pulse"
                              >
                                <Video className="h-4 w-4 mr-1" />
                                Join Session
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                              >
                                <Video className="h-4 w-4 mr-1" />
                                Not Yet
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
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
                    {isEditing ? (
                      <div className="space-y-2">
                        <Select 
                          value={selectedExpertise || profile.expertise}
                          onValueChange={handleExpertiseChange}
                        >
                          <SelectTrigger>
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
                          />
                        )}
                      </div>
                    ) : (
                      <Input
                        id="expertise"
                        value={profile.expertise}
                        disabled={true}
                      />
                    )}
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
                          e.preventDefault();
                          addSkill(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Certifications</Label>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCertificateUpload}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Certificate
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.certifications.map((cert, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {cert}
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeCertification(cert)}
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
                      placeholder="Or type certificate name and press Enter"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCertification(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  )}
                  <input
                    ref={certificateInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleCertificateSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  {isEditing ? (
                    <>
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button type="button" variant="hero" onClick={handleProfileUpdate}>
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button type="button" variant="hero" onClick={() => setIsEditing(true)}>
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
            {/* Uploaded Resources Display */}
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <File className="h-5 w-5 mr-2" /> Your Shared Resources
                  </div>
                  <Badge variant="secondary">{resources.length} Resources</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingResources ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading resources...
                  </div>
                ) : resources.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No resources shared yet</p>
                    <p className="text-sm mt-1">Share study materials and links with your students below</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resources.map((resource) => (
                      <div key={resource._id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {resource.type === 'link' ? (
                                <Link2 className="h-4 w-4 text-primary" />
                              ) : (
                                <File className="h-4 w-4 text-primary" />
                              )}
                              <h4 className="font-semibold">{resource.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {resource.category}
                              </Badge>
                              {resource.type === 'file' && (
                                <Badge variant="secondary" className="text-xs">
                                  {resource.fileType?.split('/')[1]?.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                            {resource.description && (
                              <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                            )}
                            {resource.type === 'link' ? (
                              <a 
                                href={resource.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                {resource.url}
                                <Link2 className="h-3 w-3" />
                              </a>
                            ) : (
                              <div className="flex items-center gap-3 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadFile(resource._id, resource.fileName)}
                                  className="text-primary"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  {(resource.fileSize / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-2">
                              Shared on {new Date(resource.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteResource(resource._id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" /> Share Study Materials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Upload PDFs, docs, images, videos, and zip files (Max 50MB per file)</div>
                  <Button onClick={handleUploadClick}>
                    <Upload className="h-4 w-4 mr-2" /> Upload Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFilesSelected}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar,.mp4,.avi,.mov"
                  />
                </div>

                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Click "Upload Files" to select and upload study materials</p>
                  <p className="text-xs mt-1">Supported: PDF, DOC, PPT, Images, Videos, ZIP</p>
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