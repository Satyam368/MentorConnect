import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Menu, X, GraduationCap, Bell } from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { useToast } from "@/hooks/use-toast";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();
  const { socket } = useSocket(authUser?.email);

  useEffect(() => {
    const updateAuthUser = () => {
      try {
        const raw = localStorage.getItem("authUser");
        const user = raw ? JSON.parse(raw) : null;
        console.log('Navigation authUser:', user); // Debug log
        setAuthUser(user);
        
        // Load notification count when user is logged in
        if (user) {
          loadNotificationCount(user);
        }
      } catch (_) {
        setAuthUser(null);
      }
    };

    // Initial load
    updateAuthUser();

    // Listen for custom profile update events
    window.addEventListener('profileUpdated', updateAuthUser);
    
    // Listen for notification updates
    window.addEventListener('notificationUpdate', updateAuthUser);
    
    // Listen for mentor notification updates (when they approve/decline)
    window.addEventListener('mentorNotificationUpdate', updateAuthUser);

    return () => {
      window.removeEventListener('profileUpdated', updateAuthUser);
      window.removeEventListener('notificationUpdate', updateAuthUser);
      window.removeEventListener('mentorNotificationUpdate', updateAuthUser);
    };
  }, [location.pathname]);
  
  // Listen for chat notifications via socket
  useEffect(() => {
    if (!socket || !authUser) return;
    
    const handleChatNotification = (data: any) => {
      // Increment unread count
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast({
        title: "New Message",
        description: `New message from ${data.sender}`,
        duration: 4000
      });
      
      // Dispatch custom event to update notification center
      window.dispatchEvent(new Event('notificationUpdate'));
    };
    
    const handleChatRequest = (data: any) => {
      // Increment unread count
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast({
        title: "New Chat Request",
        description: `${data.senderName || 'Someone'} wants to chat with you`,
        duration: 5000
      });
      
      // Dispatch custom event
      window.dispatchEvent(new Event('notificationUpdate'));
    };

    const handleBookingStatusUpdate = (data: any) => {
      // Only show notification to students/mentees, not mentors
      if (authUser.role === 'mentor') {
        return; // Mentors don't need to see this notification
      }
      
      // Increment unread count
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      const action = data.action === 'accepted' ? 'accepted' : 'declined';
      toast({
        title: `Session ${action}!`,
        description: `${data.mentorName} has ${action} your session request`,
        duration: 5000,
        variant: data.action === 'accepted' ? 'default' : 'destructive'
      });
      
      // Dispatch custom event to reload notification count
      window.dispatchEvent(new Event('notificationUpdate'));
    };
    
    socket.on('new-chat-notification', handleChatNotification);
    socket.on('new-chat-request', handleChatRequest);
    socket.on('booking-status-updated', handleBookingStatusUpdate);
    
    return () => {
      socket.off('new-chat-notification', handleChatNotification);
      socket.off('new-chat-request', handleChatRequest);
      socket.off('booking-status-updated', handleBookingStatusUpdate);
    };
  }, [socket, authUser, toast]);

  const loadNotificationCount = async (user: any) => {
    try {
      const bookingsResponse = await fetch(
        user.role === 'mentor' 
          ? API_ENDPOINTS.BOOKINGS_BY_MENTOR_ID(user.id)
          : API_ENDPOINTS.BOOKINGS_BY_USER(user.id)
      );
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        const bookings = bookingsData.bookings || bookingsData || [];
        
        // Count unread notifications
        let count = 0;
        
        // Pending bookings
        const pendingBookings = bookings.filter((b: any) => b.status === 'pending');
        count += pendingBookings.length;
        
        // Upcoming sessions (within 2 days)
        const confirmedBookings = bookings.filter((b: any) => {
          if (b.status !== 'confirmed') return false;
          const sessionDate = new Date(b.date);
          const daysUntil = Math.ceil((sessionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return daysUntil <= 2 && daysUntil > 0;
        });
        count += confirmedBookings.length;
        
        // Unrated completed sessions (for students)
        if (user.role === 'student') {
          const completedUnrated = bookings.filter((b: any) => 
            b.status === 'completed' && !b.rating
          );
          count += completedUnrated.length;
        }
        
        setUnreadCount(count);
      }
      
      // Add unread chat messages to count
      try {
        const chatResponse = await fetch(API_ENDPOINTS.CHAT_UNREAD(user.email));
        if (chatResponse.ok) {
          const unreadMessages = await chatResponse.json();
          setUnreadCount(prev => prev + unreadMessages.length);
        }
      } catch (error) {
        console.error('Error loading unread messages:', error);
      }
      
      // Add pending chat requests to count (for mentors)
      if (user.role === 'mentor') {
        try {
          const requestsResponse = await fetch(API_ENDPOINTS.CHAT_REQUEST_PENDING(user.email));
          if (requestsResponse.ok) {
            const pendingRequests = await requestsResponse.json();
            setUnreadCount(prev => prev + pendingRequests.length);
          }
        } catch (error) {
          console.error('Error loading chat requests:', error);
        }
      }
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("authUser");
      localStorage.removeItem("user");
    } catch (_) {}
    setAuthUser(null);
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  // Dynamic navigation based on user role
  const getNavLinks = () => {
    const baseLinks = [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
    ];

    if (!authUser) {
      return [
        ...baseLinks,
        { href: "/mentors", label: "Find Mentors" },
      ];
    }

    if (authUser.role === "mentor") {
      return [
        ...baseLinks,
        { href: "/mentor-dashboard", label: "Dashboard" },
        { href: "/messages", label: "Messages" },
        { href: "/profile", label: "Profile" },
      ];
    } else if (authUser.role === "student") {
      return [
        ...baseLinks,
        { href: "/mentors", label: "Find Mentors" },
        { href: "/student-dashboard", label: "Dashboard" },
        { href: "/requests", label: "Requests" },
        { href: "/progress", label: "Progress" },
      ];
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-background/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg group-hover:shadow-glow transition-all duration-300">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Mentor Connect</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`transition-colors duration-200 ${
                  isActive(link.href)
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {authUser ? (
              <div className="flex items-center space-x-3">
                {/* Notification Bell */}
                <Link to="/notifications" className="relative">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                
                <Link to="/profile" className="cursor-pointer">
                  <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary transition-colors">
                    {authUser.profilePicture && (
                      <AvatarImage 
                        src={`${API_BASE_URL}${authUser.profilePicture}`} 
                        alt={authUser.name}
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {authUser.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{authUser.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {authUser.role === "mentor" ? "🎓 Mentor" : "📚 Student"}
                  </p>
                </div>
                <Button variant="ghost" onClick={handleLogout}>Logout</Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="hero">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-card border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActive(link.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 space-y-2">
              {authUser ? (
                <>
                  {/* Mobile Notification Bell */}
                  <Link to="/notifications" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start relative">
                      <Bell className="h-5 w-5 mr-2" />
                      Notifications
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                    <div className="px-3 py-2 flex items-center space-x-3 hover:bg-muted rounded-md cursor-pointer transition-colors">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                          {authUser.profilePicture && (
                            <AvatarImage 
                              src={`${API_BASE_URL}${authUser.profilePicture}`} 
                              alt={authUser.name}
                            />
                          )}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {authUser.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <p className="text-foreground font-medium">{authUser.name}</p>
                        <p className="text-muted-foreground capitalize">
                          {authUser.role === "mentor" ? "🎓 Mentor" : "📚 Student"}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Login</Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="hero" className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;