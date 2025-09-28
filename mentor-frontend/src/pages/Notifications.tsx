import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Phone, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Notifications = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    emailEnabled: true,
    smsEnabled: false,
    reminderTiming: "24h",
    email: "alex@example.com",
    phone: "+1 555 000 0000",
    calendarInvite: true,
  });

  const handleSave = () => {
    toast({ title: "Notification preferences saved" });
  };

  return (
    <div className="flex-1 bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
            <Bell className="h-7 w-7 mr-2 text-primary" /> Notifications
          </h1>
          <p className="text-muted-foreground">Configure email and SMS reminders for your sessions</p>
        </div>

        <Card className="mentor-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center"><Mail className="h-5 w-5 mr-2" /> Email Notifications</CardTitle>
            <CardDescription>Receive updates and reminders by email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailEnabled">Enable email notifications</Label>
              <Switch id="emailEnabled" checked={settings.emailEnabled} onCheckedChange={(v) => setSettings(prev => ({ ...prev, emailEnabled: v }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={settings.email} onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="mentor-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center"><Phone className="h-5 w-5 mr-2" /> SMS Notifications</CardTitle>
            <CardDescription>Get important alerts on your phone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="smsEnabled">Enable SMS notifications</Label>
              <Switch id="smsEnabled" checked={settings.smsEnabled} onCheckedChange={(v) => setSettings(prev => ({ ...prev, smsEnabled: v }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={settings.phone} onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="mentor-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center"><Clock className="h-5 w-5 mr-2" /> Reminder Timing</CardTitle>
            <CardDescription>When should we remind you about sessions?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Send reminder</Label>
              <Select value={settings.reminderTiming} onValueChange={(v) => setSettings(prev => ({ ...prev, reminderTiming: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 hours before</SelectItem>
                  <SelectItem value="12h">12 hours before</SelectItem>
                  <SelectItem value="2h">2 hours before</SelectItem>
                  <SelectItem value="30m">30 minutes before</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="calendar">Send calendar invite (ICS)</Label>
              <Switch id="calendar" checked={settings.calendarInvite} onCheckedChange={(v) => setSettings(prev => ({ ...prev, calendarInvite: v }))} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" /> Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Notifications;


