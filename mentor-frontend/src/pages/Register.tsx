import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, ArrowLeft, ArrowRight, Phone, BookOpen, Clock, Globe, Briefcase, Award, Target, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api";
import { motion } from "framer-motion";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "student",
    mentor: {
      domain: "",
      experience: "",
      hourlyRate: "",
      languages: "",
      services: "",
      availability: ""
    },
    mentee: {
      targetRole: "",
      currentLevel: "Junior",
      interests: "",
      goals: ""
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone) && phone.length >= 10;
  };

  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return { isValid: false, message: "Password must be at least 8 characters long" };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one number" };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one special character" };
    }
    return { isValid: true, message: "" };
  };

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }

    if (field === "email" && value) {
      if (!validateEmail(value)) {
        setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
      }
    }

    if (field === "phone" && value) {
      if (!validatePhone(value)) {
        setErrors(prev => ({ ...prev, phone: "Please enter a valid phone number (min 10 digits)" }));
      }
    }

    if (field === "name" && value) {
      if (!validateName(value)) {
        setErrors(prev => ({ ...prev, name: "Name must be at least 2 characters and contain only letters" }));
      }
    }

    if (field === "password" && value) {
      const validation = validatePassword(value);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, password: validation.message }));
      }
    }

    if (field === "confirmPassword" && value) {
      if (value !== formData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      }
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!validateName(formData.name)) {
      newErrors.name = "Name must be at least 2 characters and contain only letters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number (min 10 digits)";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.role === "mentor") {
      if (!formData.mentor.domain.trim()) {
        newErrors.domain = "Domain is required for mentors";
      }
      if (!formData.mentor.experience) {
        newErrors.experience = "Experience is required for mentors";
      }
      if (formData.mentor.hourlyRate && (isNaN(Number(formData.mentor.hourlyRate)) || Number(formData.mentor.hourlyRate) < 0)) {
        newErrors.hourlyRate = "Please enter a valid hourly rate";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(API_ENDPOINTS.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          email: formData.email.trim().toLowerCase(),
          name: formData.name.trim(),
          password: formData.password.trim(),
          phone: formData.phone?.trim() || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Registration failed");

      try {
        localStorage.setItem("authUser", JSON.stringify(data.user));
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem("authToken", data.token);
        }
      } catch (_) { }

      toast({ title: "Account created!", description: "Welcome to Mentor Connect!" });
      navigate(`/verify?email=${encodeURIComponent(formData.email)}&phone=${encodeURIComponent(formData.phone)}&role=${formData.role}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center p-16">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 mb-8 shadow-2xl">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
              Start your journey with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Mentor Connect.</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-8">
              Create an account to access personalized mentorship, expert guidance, and a community of learners.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-background min-h-screen">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-xl space-y-10"
        >
          <div className="space-y-2">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6 group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to presentation
            </Link>
            <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
            <p className="text-muted-foreground">
              Enter your details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`pl-10 h-12 bg-muted/30 border-input-border focus:bg-background transition-all ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    required
                  />
                </div>
                {errors.name && <p className="text-xs text-destructive font-medium">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`pl-10 h-12 bg-muted/30 border-input-border focus:bg-background transition-all ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    required
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive font-medium">{errors.email}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <div className="relative group">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={`pl-10 h-12 bg-muted/30 border-input-border focus:bg-background transition-all ${errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
              </div>
              {errors.phone && <p className="text-xs text-destructive font-medium">{errors.phone}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`pl-10 pr-10 h-12 bg-muted/30 border-input-border focus:bg-background transition-all ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-xs text-destructive font-medium">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={`pl-10 pr-10 h-12 bg-muted/30 border-input-border focus:bg-background transition-all ${errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive font-medium">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-base text-foreground font-semibold">I want to join as a:</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => handleInputChange("role", value)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="student" id="student" className="peer sr-only" />
                  <Label
                    htmlFor="student"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary cursor-pointer transition-all h-full"
                  >
                    <User className="mb-2 h-6 w-6" />
                    <span className="font-semibold">Student</span>
                    <span className="text-xs text-muted-foreground mt-1 text-center font-normal">Looking to learn</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="mentor" id="mentor" className="peer sr-only" />
                  <Label
                    htmlFor="mentor"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary cursor-pointer transition-all h-full"
                  >
                    <GraduationCap className="mb-2 h-6 w-6" />
                    <span className="font-semibold">Mentor</span>
                    <span className="text-xs text-muted-foreground mt-1 text-center font-normal">Expert guidance</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Role Specific Fields */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {formData.role === "mentor" ? (
                <div className="space-y-4 p-5 bg-muted/20 rounded-xl border border-border/50">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Mentor Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="domain">Primary Domain *</Label>
                      <div className="relative group">
                        <BookOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="domain"
                          placeholder="e.g., Software Engineering"
                          value={formData.mentor.domain}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, mentor: { ...prev.mentor, domain: e.target.value } }));
                            if (errors.domain) setErrors(prev => ({ ...prev, domain: "" }));
                          }}
                          className={`pl-10 h-12 bg-background/50 border-input-border focus:bg-background transition-all ${errors.domain ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        />
                      </div>
                      {errors.domain && <p className="text-xs text-destructive font-medium">{errors.domain}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Experience *</Label>
                      <Select
                        value={formData.mentor.experience}
                        onValueChange={(v) => {
                          setFormData(prev => ({ ...prev, mentor: { ...prev.mentor, experience: v } }));
                          if (errors.experience) setErrors(prev => ({ ...prev, experience: "" }));
                        }}
                      >
                        <SelectTrigger className={`h-12 bg-background/50 transition-all ${errors.experience ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Select years" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-2 years">1-2 years</SelectItem>
                          <SelectItem value="3-5 years">3-5 years</SelectItem>
                          <SelectItem value="5-10 years">5-10 years</SelectItem>
                          <SelectItem value="10+ years">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.experience && <p className="text-xs text-destructive font-medium">{errors.experience}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                      <div className="relative group">
                        <span className="absolute left-3 top-3 h-4 flex items-center justify-center text-muted-foreground font-bold text-sm">₹</span>
                        <Input
                          id="hourlyRate"
                          type="number"
                          placeholder="1500"
                          min="0"
                          value={formData.mentor.hourlyRate}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, mentor: { ...prev.mentor, hourlyRate: e.target.value } }));
                            if (errors.hourlyRate) setErrors(prev => ({ ...prev, hourlyRate: "" }));
                          }}
                          className={`pl-8 h-12 bg-background/50 border-input-border focus:bg-background transition-all ${errors.hourlyRate ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        />
                      </div>
                      {errors.hourlyRate && <p className="text-xs text-destructive font-medium">{errors.hourlyRate}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="languages">Languages</Label>
                      <div className="relative group">
                        <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="languages"
                          placeholder="e.g., English, Spanish"
                          value={formData.mentor.languages}
                          onChange={(e) => setFormData(prev => ({ ...prev, mentor: { ...prev.mentor, languages: e.target.value } }))}
                          className="pl-10 h-12 bg-background/50 border-input-border focus:bg-background transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-5 bg-muted/20 rounded-xl border border-border/50">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Student Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetRole">Target Role</Label>
                      <div className="relative group">
                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="targetRole"
                          placeholder="e.g., Frontend Developer"
                          value={formData.mentee.targetRole}
                          onChange={(e) => setFormData(prev => ({ ...prev, mentee: { ...prev.mentee, targetRole: e.target.value } }))}
                          className="pl-10 h-12 bg-background/50 border-input-border focus:bg-background transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Current Level</Label>
                      <Select
                        value={formData.mentee.currentLevel}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, mentee: { ...prev.mentee, currentLevel: v } }))}
                      >
                        <SelectTrigger className="h-12 bg-background/50 transition-all">
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goals">Learning Goals</Label>
                    <Textarea
                      id="goals"
                      placeholder="Briefly describe your goals"
                      rows={2}
                      value={formData.mentee.goals}
                      onChange={(e) => setFormData(prev => ({ ...prev, mentee: { ...prev.mentee, goals: e.target.value } }))}
                      className="bg-background/50 border-input-border focus:bg-background transition-all resize-none"
                    />
                  </div>
                </div>
              )}
            </motion.div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all btn-premium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-medium">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-12 hover:bg-muted/50 hover:border-primary/30 transition-all" onClick={() => {
              const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
              window.location.href = `${baseUrl}/api/auth/google`;
            }}>
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
              Google
            </Button>
            <Button variant="outline" className="h-12 hover:bg-muted/50 hover:border-primary/30 transition-all" onClick={() => toast({ title: "LinkedIn sign-in", description: "Coming soon" })}>
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="linkedin" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"></path></svg>
              LinkedIn
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-primary hover:underline transition-all">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
