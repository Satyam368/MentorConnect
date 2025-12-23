import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Menu, X, GraduationCap, Bell } from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [authUser, setAuthUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();
  const { socket } = useSocket(authUser?.email);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateAuthUser = () => {
      try {
        const raw = localStorage.getItem("authUser");
        const user = raw ? JSON.parse(raw) : null;
        setAuthUser(user);

        if (user) {
          loadNotificationCount(user);
        }
      } catch (_) {
        setAuthUser(null);
      }
    };

    updateAuthUser();
    window.addEventListener('profileUpdated', updateAuthUser);
    window.addEventListener('notificationUpdate', updateAuthUser);
    window.addEventListener('mentorNotificationUpdate', updateAuthUser);

    return () => {
      window.removeEventListener('profileUpdated', updateAuthUser);
      window.removeEventListener('notificationUpdate', updateAuthUser);
      window.removeEventListener('mentorNotificationUpdate', updateAuthUser);
    };
  }, [location.pathname]);

  // Socket listeners (kept same as before)
  useEffect(() => {
    if (!socket || !authUser) return;

    const handleChatNotification = (data: any) => {
      setUnreadCount(prev => prev + 1);
      toast({
        title: "New Message",
        description: `New message from ${data.sender}`,
        duration: 4000
      });
      window.dispatchEvent(new Event('notificationUpdate'));
    };

    const handleChatRequest = (data: any) => {
      setUnreadCount(prev => prev + 1);
      toast({
        title: "New Chat Request",
        description: `${data.senderName || 'Someone'} wants to chat with you`,
        duration: 5000
      });
      window.dispatchEvent(new Event('notificationUpdate'));
    };

    const handleBookingStatusUpdate = (data: any) => {
      if (authUser.role === 'mentor') return;

      setUnreadCount(prev => prev + 1);
      const action = data.action === 'accepted' ? 'accepted' : 'declined';
      toast({
        title: `Session ${action}!`,
        description: `${data.mentorName} has ${action} your session request`,
        duration: 5000,
        variant: data.action === 'accepted' ? 'default' : 'destructive'
      });
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

        let count = 0;
        const pendingBookings = bookings.filter((b: any) => b.status === 'pending');
        count += pendingBookings.length;

        const confirmedBookings = bookings.filter((b: any) => {
          if (b.status !== 'confirmed') return false;
          const sessionDate = new Date(b.date);
          const daysUntil = Math.ceil((sessionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return daysUntil <= 2 && daysUntil > 0;
        });
        count += confirmedBookings.length;

        if (user.role === 'student') {
          const completedUnrated = bookings.filter((b: any) =>
            b.status === 'completed' && !b.rating
          );
          count += completedUnrated.length;
        }

        setUnreadCount(count);
      }

      try {
        const chatResponse = await fetch(API_ENDPOINTS.CHAT_UNREAD(user.email));
        if (chatResponse.ok) {
          const unreadMessages = await chatResponse.json();
          setUnreadCount(prev => prev + unreadMessages.length);
        }
      } catch (error) {
        console.error('Error loading unread messages:', error);
      }

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
    } catch (_) { }
    setAuthUser(null);
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const getNavLinks = () => {
    const baseLinks = [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
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
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out ${scrolled || isMenuOpen
        ? "bg-background/90 backdrop-blur-xl border-b border-border/10 shadow-lg shadow-primary/5 supports-[backdrop-filter]:bg-background/80"
        : "bg-transparent border-transparent pt-4"
        }`}
    >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${scrolled ? 'py-0' : 'py-2'}`}>
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group active:scale-95 transition-transform duration-200">
            <div className={`bg-gradient-to-tr from-primary to-secondary p-2.5 rounded-xl transition-all duration-500 group-hover:shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)] group-hover:rotate-6 ${scrolled ? 'shadow-sm' : 'shadow-lg'}`}>
              <GraduationCap className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <span className={`text-xl font-bold tracking-tight transition-colors duration-300 group-hover:text-primary ${(location.pathname === '/login' || location.pathname === '/register') && !scrolled
                ? "text-foreground lg:text-white"
                : "text-foreground"
              }`}>
              Mentor<span className="text-primary">Connect</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 bg-background/80 backdrop-blur-md px-2 py-1.5 rounded-full border border-border/10 shadow-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive(link.href)
                  ? "text-primary bg-primary/10 shadow-[0_0_10px_-2px_rgba(var(--primary),0.2)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 rounded-full bg-primary/5 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            {authUser ? (
              <div className="flex items-center space-x-3 pl-4 border-l border-border/50">
                <Link to="/notifications" className="relative group">
                  <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-primary/10 hover:text-primary transition-colors duration-300">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-destructive rounded-full ring-2 ring-background animate-pulse" />
                    )}
                  </Button>
                </Link>

                <div className="flex items-center gap-3 pl-2">
                  <div className="text-right hidden xl:block leading-tight">
                    <p className="text-sm font-semibold text-foreground">{authUser.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      {authUser.role}
                    </p>
                  </div>

                  <Link to="/profile" className="group">
                    <div className="p-0.5 rounded-full bg-gradient-to-br from-primary to-secondary group-hover:shadow-[0_0_15px_-3px_rgba(var(--primary),0.4)] transition-all duration-300">
                      <Avatar className="h-9 w-9 border-2 border-background">
                        {authUser.profilePicture && (
                          <AvatarImage
                            src={`${API_BASE_URL}${authUser.profilePicture}`}
                            alt={authUser.name}
                            className="object-cover"
                          />
                        )}
                        <AvatarFallback className="bg-background text-primary font-bold text-xs">
                          {authUser.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </Link>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Logout"
                  >
                    <div className="h-5 w-5 i-lucide-log-out" />
                    {/* Assuming lucide or standard icon usage, adjusted from text to icon for cleaner look if possible, reverting to text if no icon available in import */}
                    <span className="sr-only">Logout</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out h-5 w-5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" className="rounded-full font-medium hover:bg-primary/5 hover:text-primary transition-all">Login</Button>
                </Link>
                <Link to="/register">
                  <Button className="rounded-full bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_20px_-5px_rgba(var(--primary),0.5)] hover:bg-primary/90 text-white font-medium px-6 shadow-lg transition-all duration-300">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-full hover:bg-primary/10 hover:text-primary"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background/80 backdrop-blur-xl border-t border-border/50 overflow-hidden shadow-2xl"
          >
            <div className="px-4 pt-4 pb-8 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-base font-medium transition-all duration-200 ${isActive(link.href)
                    ? "text-primary bg-primary/10 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                  {isActive(link.href) && <div className="h-2 w-2 rounded-full bg-primary" />}
                </Link>
              ))}

              <div className="pt-6 space-y-4 border-t border-dashed border-border/50 mt-4 px-2">
                {authUser ? (
                  <>
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="block">
                      <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/30 border border-border/50">
                        <div className="p-0.5 rounded-full bg-gradient-to-br from-primary to-secondary">
                          <Avatar className="h-12 w-12 border-2 border-background">
                            {authUser.profilePicture && (
                              <AvatarImage
                                src={`${API_BASE_URL}${authUser.profilePicture}`}
                                alt={authUser.name}
                              />
                            )}
                            <AvatarFallback className="bg-background text-primary font-bold">
                              {authUser.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground font-semibold">{authUser.name}</p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                            {authUser.role}
                          </p>
                        </div>
                        <div className="bg-background p-2 rounded-full shadow-sm text-primary">
                          <div className="i-lucide-chevron-right h-4 w-4" />
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                        </div>
                      </div>
                    </Link>

                    <div className="grid grid-cols-2 gap-3">
                      <Link to="/notifications" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-center gap-2 rounded-xl h-11 border-border/50 bg-background/50">
                          <Bell className="h-4 w-4" />
                          <span className="relative">
                            Alerts
                            {unreadCount > 0 && <span className="absolute -top-1 -right-2 h-2 w-2 bg-destructive rounded-full" />}
                          </span>
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        className="w-full justify-center gap-2 rounded-xl h-11 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 shadow-none"
                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                      >
                        Logout
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full rounded-full h-12 border-primary/20 hover:bg-primary/5 text-primary">Log in</Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full rounded-full h-12 bg-gradient-to-r from-primary to-secondary text-white shadow-lg">Get Started</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;
