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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  if (formData.password !== formData.confirmPassword) {
    toast({ title: "Password mismatch", description: "Please make sure your passwords match.", variant: "destructive" });
    setIsLoading(false);
    return;
  }

  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/register`, {
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
                    className="pl-10"
                    required
                  />
                </div>
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
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="pl-3"
                  />
                </div>
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
                    className="pl-10 pr-10"
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
                    className="pl-10 pr-10"
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
                      <Label htmlFor="domain">Primary Domain</Label>
                      <Input
                        id="domain"
                        placeholder="e.g., Software Engineering"
                        value={formData.mentor.domain}
                        onChange={(e) => setFormData(prev => ({ ...prev, mentor: { ...prev.mentor, domain: e.target.value } }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Experience</Label>
                      <Select
                        value={formData.mentor.experience}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, mentor: { ...prev.mentor, experience: v } }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select years" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-2 years">1-2 years</SelectItem>
                          <SelectItem value="3-5 years">3-5 years</SelectItem>
                          <SelectItem value="5-10 years">5-10 years</SelectItem>
                          <SelectItem value="10+ years">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Hourly Rate (₹ INR)</Label>
                      <Input
                        id="hourlyRate"
                        placeholder="₹1500"
                        value={formData.mentor.hourlyRate}
                        onChange={(e) => setFormData(prev => ({ ...prev, mentor: { ...prev.mentor, hourlyRate: e.target.value } }))}
                      />
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