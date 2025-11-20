import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api";

const Verify = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const prefilledEmail = params.get("email") || "";
  const prefilledPhone = params.get("phone") || "";
  const role = params.get("role") || "student";

  const [email, setEmail] = useState(prefilledEmail);
  const [phone, setPhone] = useState(prefilledPhone);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [activeTab, setActiveTab] = useState(prefilledPhone ? "phone" : "email");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendCode = async () => {
    try {
      setIsSending(true);
      const channel = activeTab;
      const body = channel === "email" ? { channel, email } : { channel, phone };
      const res = await fetch(API_ENDPOINTS.OTP_SEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send code");
      toast({ title: "Verification code sent", description: channel === "email" ? `Code sent to ${email}` : `Code sent to ${phone}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      const code = otp.join("");
      const channel = activeTab;
      const body = channel === "email" ? { channel, email, otp: code } : { channel, phone, otp: code };
      const res = await fetch(API_ENDPOINTS.OTP_VERIFY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");
      toast({ title: "Verified successfully!", description: "Your account has been verified." });
      navigate(role === "mentor" ? "/mentor-dashboard" : "/student-dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    const val = value.replace(/[^0-9]/g, "").slice(0, 1);
    
    // Update the OTP array
    const next = [...otp];
    next[index] = val;
    setOtp(next);

    // Auto-focus to next input if value is entered
    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace - move to previous input if current is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    
    // Handle arrow keys for navigation
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      
      // Focus on the next empty field or the last field
      const nextIndex = Math.min(pastedData.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-2" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Verify your account</h1>
          <p className="text-muted-foreground">Enter the 6-digit code we sent to complete sign up</p>
        </div>

        <Card className="mentor-card">
          <CardHeader>
            <CardTitle>Verification</CardTitle>
            <CardDescription>Select email or phone to receive your code</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2" />Email</TabsTrigger>
                <TabsTrigger value="phone"><Phone className="h-4 w-4 mr-2" />Phone</TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <Button className="w-full" onClick={handleSendCode} disabled={!email || isSending}>
                  {isSending ? "Sending..." : "Send Code"}
                </Button>
              </TabsContent>

              <TabsContent value="phone" className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
                </div>
                <Button className="w-full" onClick={handleSendCode} disabled={!phone || isSending}>
                  {isSending ? "Sending..." : "Send Code"}
                </Button>
              </TabsContent>
            </Tabs>

            <div className="mt-6 space-y-3">
              <Label id="otp-label">Enter 6-digit code</Label>
              <div className="grid grid-cols-6 gap-2" role="group" aria-labelledby="otp-label">
                {otp.map((v, idx) => (
                  <Input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    inputMode="numeric"
                    maxLength={1}
                    value={v}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className="text-center text-lg font-semibold"
                    autoComplete="off"
                  />
                ))}
              </div>
              <Button className="w-full" onClick={handleVerify} disabled={otp.join("").length !== 6 || isVerifying}>
                {isVerifying ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Verify;


