import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, GraduationCap } from "lucide-react";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("authUser");
      setAuthUser(raw ? JSON.parse(raw) : null);
    } catch (_) {
      setAuthUser(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("authUser");
      localStorage.removeItem("user");
    } catch (_) {}
    setAuthUser(null);
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
        { href: "/requests", label: "Requests" },
        { href: "/profile", label: "Profile" },
      ];
    } else if (authUser.role === "student") {
      return [
        ...baseLinks,
        { href: "/mentors", label: "Find Mentors" },
        { href: "/student-dashboard", label: "Dashboard" },
        { href: "/booking", label: "My Bookings" },
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
                  <div className="px-3 py-2 text-sm">
                    <p className="text-foreground font-medium">{authUser.name}</p>
                    <p className="text-muted-foreground capitalize">
                      {authUser.role === "mentor" ? "🎓 Mentor" : "📚 Student"}
                    </p>
                  </div>
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