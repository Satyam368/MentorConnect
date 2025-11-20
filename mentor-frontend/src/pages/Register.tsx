import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS, apiRequest } from "@/lib/api";

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
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    
    // Real-time validation
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
  
  // Comprehensive validation
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
  
  // Role-specific validation
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
    toast({ 
      title: "Validation Error", 
      description: "Please fix the errors in the form", 
      variant: "destructive" 
    });
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

    // Store user data in localStorage for immediate access
    try {
      localStorage.setItem("authUser", JSON.stringify(data.user));
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (_) {}

    toast({ title: "Account created!", description: "Verify to continue" });
    navigate(`/verify?email=${encodeURIComponent(formData.email)}&phone=${encodeURIComponent(formData.phone)}&role=${formData.role}`);
  } catch (err: any) {
    toast({ title: "Error", description: err.message, variant: "destructive" });
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Mentor Connect</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Join Us Today</h1>
          <p className="text-muted-foreground">Create your account to start connecting</p>
        </div>

        <Card className="mentor-card">
          <CardHeader className="text-center">
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Fill in your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
                    required
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`pl-3 ${errors.phone ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
                <p className="text-xs text-muted-foreground">Min 10 digits required</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">Min 8 characters, uppercase, lowercase, number & special char</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label>I am a:</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="student" />
                    <Label htmlFor="student">Student</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mentor" id="mentor" />
                    <Label htmlFor="mentor">Mentor</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Role-specific details */}
              {formData.role === "mentor" && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="domain">Primary Domain *</Label>
                      <Input
                        id="domain"
                        placeholder="e.g., Software Engineering"
                        value={formData.mentor.domain}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, mentor: { ...prev.mentor, domain: e.target.value } }));
                          if (errors.domain) setErrors(prev => ({ ...prev, domain: "" }));
                        }}
                        className={errors.domain ? 'border-destructive' : ''}
                      />
                      {errors.domain && (
                        <p className="text-sm text-destructive">{errors.domain}</p>
                      )}
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
                        <SelectTrigger className={errors.experience ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select years" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-2 years">1-2 years</SelectItem>
                          <SelectItem value="3-5 years">3-5 years</SelectItem>
                          <SelectItem value="5-10 years">5-10 years</SelectItem>
                          <SelectItem value="10+ years">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.experience && (
                        <p className="text-sm text-destructive">{errors.experience}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Hourly Rate (₹ INR)</Label>
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
                        className={errors.hourlyRate ? 'border-destructive' : ''}
                      />
                      {errors.hourlyRate && (
                        <p className="text-sm text-destructive">{errors.hourlyRate}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="languages">Languages</Label>
                      <Input
                        id="languages"
                        placeholder="e.g., English, Spanish"
                        value={formData.mentor.languages}
                        onChange={(e) => setFormData(prev => ({ ...prev, mentor: { ...prev.mentor, languages: e.target.value } }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="services">Services Offered</Label>
                    <Input
                      id="services"
                      placeholder="e.g., Interview Prep, Career Guidance"
                      value={formData.mentor.services}
                      onChange={(e) => setFormData(prev => ({ ...prev, mentor: { ...prev.mentor, services: e.target.value } }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <Textarea
                      id="availability"
                      placeholder="e.g., Mon 9-12, Wed 14-17"
                      rows={3}
                      value={formData.mentor.availability}
                      onChange={(e) => setFormData(prev => ({ ...prev, mentor: { ...prev.mentor, availability: e.target.value } }))}
                    />
                  </div>
                </div>
              )}

              {formData.role === "student" && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetRole">Target Role</Label>
                      <Input
                        id="targetRole"
                        placeholder="e.g., Frontend Developer"
                        value={formData.mentee.targetRole}
                        onChange={(e) => setFormData(prev => ({ ...prev, mentee: { ...prev.mentee, targetRole: e.target.value } }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Level</Label>
                      <Select
                        value={formData.mentee.currentLevel}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, mentee: { ...prev.mentee, currentLevel: v } }))}
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interests">Interests</Label>
                    <Input
                      id="interests"
                      placeholder="e.g., React, System Design"
                      value={formData.mentee.interests}
                      onChange={(e) => setFormData(prev => ({ ...prev, mentee: { ...prev.mentee, interests: e.target.value } }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goals">Learning Goals</Label>
                    <Textarea
                      id="goals"
                      placeholder="Briefly describe your goals"
                      rows={3}
                      value={formData.mentee.goals}
                      onChange={(e) => setFormData(prev => ({ ...prev, mentee: { ...prev.mentee, goals: e.target.value } }))}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="hero"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Auth */}
        <div className="mt-6">
          <Card className="mentor-card">
            <CardHeader className="text-center">
              <CardTitle>Or sign up with</CardTitle>
              <CardDescription>Use a social account to create your profile</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="outline" className="w-full" onClick={() => toast({ title: "Google sign-up", description: "Mocked Google OAuth" })}>
                <span className="mr-2">🔴</span>
                Google
              </Button>
              <Button variant="outline" className="w-full" onClick={() => toast({ title: "LinkedIn sign-up", description: "Mocked LinkedIn OAuth" })}>
                <span className="mr-2">in</span>
                LinkedIn
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;