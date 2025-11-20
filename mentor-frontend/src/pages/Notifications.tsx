import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Mail, Phone, Calendar, Clock, Check, CheckCheck, Trash2, MessageSquare, Star, Users, Info, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";

interface Notification {
  id: string;
  type: 'booking' | 'message' | 'rating' | 'session' | 'system' | 'reminder';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
  priority?: 'low' | 'normal' | 'high';
  sender?: {
    name: string;
    avatar?: string;
  };
}

const Notifications = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [authUser, setAuthUser] = useState<any>(null);
  const { socket } = useSocket(authUser?.email);
  const [settings, setSettings] = useState({
    emailEnabled: true,
    smsEnabled: false,
    reminderTiming: "24h",
    email: "alex@example.com",
    phone: "+1 555 000 0000",
    calendarInvite: true,
  });

  useEffect(() => {
    const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
    if (userData) {
      setAuthUser(JSON.parse(userData));
    }
    loadNotifications();
    
    // Listen for notification updates
    const handleNotificationUpdate = () => {
      console.log('🔄 Reloading notifications due to update event');
      loadNotifications();
    };
    
    window.addEventListener('notificationUpdate', handleNotificationUpdate);
    window.addEventListener('mentorNotificationUpdate', handleNotificationUpdate);
    
    return () => {
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
      window.removeEventListener('mentorNotificationUpdate', handleNotificationUpdate);
    };
  }, []);
  
  // Listen for real-time chat notifications
  useEffect(() => {
    if (!socket) return;
    
    const handleChatNotification = (data: any) => {
      // Add new notification to the list
      const newNotification: Notification = {
        id: `chat-${data.sender}-${Date.now()}`,
        type: 'message',
        title: 'New Message',
        message: data.content,
        time: new Date(data.timestamp).toISOString(),
        read: false,
        actionUrl: `/chat/${data.sender}`,
        priority: 'high',
        sender: {
          name: data.sender
        }
      };
      
      setNotifications(prev => [newNotification, ...prev]);
    };

    const handleBookingStatusUpdate = (data: any) => {
      console.log('📢 Booking status updated notification:', data);
      
      // Only show notification to students/mentees, not mentors
      if (authUser && authUser.role === 'mentor') {
        return; // Mentors don't need to see this notification
      }
      
      // Add notification about booking status change
      const action = data.action === 'accepted' ? 'accepted' : data.action === 'declined' ? 'declined' : 'updated';
      const newNotification: Notification = {
        id: `booking-status-${data.bookingId}-${Date.now()}`,
        type: 'booking',
        title: `Session ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        message: `${data.mentorName} has ${action} your session request`,
        time: new Date().toISOString(),
        read: false,
        actionUrl: '/requests',
        priority: 'high',
        sender: {
          name: data.mentorName
        }
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      // Trigger notification count update in Navigation
      window.dispatchEvent(new Event('notificationUpdate'));
    };
    
    socket.on('new-chat-notification', handleChatNotification);
    socket.on('booking-status-updated', handleBookingStatusUpdate);
    
    return () => {
      socket.off('new-chat-notification', handleChatNotification);
      socket.off('booking-status-updated', handleBookingStatusUpdate);
    };
  }, [socket]);

  const loadNotifications = async () => {
    try {
      const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const mockNotifications: Notification[] = [];
      
      // Fetch unread chat messages
      try {
        const chatResponse = await fetch(
          API_ENDPOINTS.CHAT_UNREAD(user.email)
        );
        
        if (chatResponse.ok) {
          const unreadMessages = await chatResponse.json();
          
          // Group messages by sender
          const messageBySender = new Map();
          unreadMessages.forEach((msg: any) => {
            if (!messageBySender.has(msg.sender)) {
              messageBySender.set(msg.sender, []);
            }
            messageBySender.get(msg.sender).push(msg);
          });
          
          // Create notifications for unread messages
          messageBySender.forEach((messages, sender) => {
            const latestMessage = messages[messages.length - 1];
            mockNotifications.push({
              id: `chat-${sender}-${Date.now()}`,
              type: 'message',
              title: 'New Message',
              message: `${messages.length} new message${messages.length > 1 ? 's' : ''} from ${sender}`,
              time: new Date(latestMessage.timestamp).toISOString(),
              read: false,
              actionUrl: `/chat/${sender}`,
              priority: 'high',
              sender: {
                name: sender
              }
            });
          });
        }
      } catch (error) {
        console.error('Error loading chat notifications:', error);
      }

      try {
        const bookingsResponse = await fetch(
          user.role === 'mentor' 
            ? API_ENDPOINTS.BOOKINGS_BY_MENTOR_ID(user.id)
            : API_ENDPOINTS.BOOKINGS_BY_USER(user.id)
        );
        
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          const bookings = bookingsData.bookings || bookingsData || [];

          // Pending bookings - only show to mentors, not students
          const pendingBookings = bookings.filter((b: any) => b.status === 'pending');
          if (user.role === 'mentor') {
            pendingBookings.forEach((booking: any) => {
              mockNotifications.push({
                id: `booking-${booking._id}`,
                type: 'booking',
                title: 'New Session Request',
                message: `New session request for ${booking.sessionType}`,
                time: new Date(booking.createdAt || booking.date).toISOString(),
                read: false,
                actionUrl: `/chat?user=${booking.user?.email || ''}`,
                priority: 'high',
                sender: { name: booking.user?.name || 'Student' }
              });
            });
          }

          // Upcoming session reminders
          const confirmedBookings = bookings.filter((b: any) => 
            b.status === 'confirmed' && new Date(b.date) > new Date()
          );
          
          confirmedBookings.forEach((booking: any) => {
            const sessionDateObj = new Date(booking.date);
            const [hours, minutes] = (booking.time || '00:00').split(':');
            const sessionDateTime = new Date(sessionDateObj);
            sessionDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            const now = new Date();
            const minutesUntil = Math.floor((sessionDateTime.getTime() - now.getTime()) / (1000 * 60));
            const hoursUntil = Math.floor(minutesUntil / 60);
            const daysUntil = Math.floor(hoursUntil / 24);
            
            // For mentees: show reminder if session is within 30 minutes
            // For mentors: show reminder if session is within 2 days
            const shouldShowReminder = user.role === 'student' 
              ? (minutesUntil > 0 && minutesUntil <= 30)
              : (daysUntil <= 2);
            
            if (shouldShowReminder) {
              let reminderMessage = '';
              let priority: 'low' | 'normal' | 'high' = 'normal';
              
              if (minutesUntil <= 30 && minutesUntil > 0) {
                reminderMessage = `Session with ${user.role === 'mentor' ? (booking.user?.name || 'student') : booking.mentorName} starts in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`;
                priority = 'high';
              } else if (hoursUntil < 24) {
                reminderMessage = `Session with ${user.role === 'mentor' ? (booking.user?.name || 'student') : booking.mentorName} starts in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`;
                priority = 'high';
              } else {
                reminderMessage = `Session with ${user.role === 'mentor' ? (booking.user?.name || 'student') : booking.mentorName} in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
              }
              
              mockNotifications.push({
                id: `reminder-${booking._id}`,
                type: 'reminder',
                title: 'Upcoming Session',
                message: reminderMessage,
                time: new Date().toISOString(),
                read: false,
                actionUrl: user.role === 'mentor' ? `/chat?user=${booking.user?.email || ''}` : `/chat?user=${booking.mentor?.email || ''}`,
                priority: priority,
                sender: { name: user.role === 'mentor' ? (booking.user?.name || 'Student') : booking.mentorName }
              });
            }
          });

          // Completed sessions needing rating
          if (user.role === 'student') {
            const completedUnrated = bookings.filter((b: any) => 
              b.status === 'completed' && !b.rating
            ).slice(0, 2);
            
            completedUnrated.forEach((booking: any) => {
              mockNotifications.push({
                id: `rate-${booking._id}`,
                type: 'rating',
                title: 'Rate Your Session',
                message: `Please rate your session with ${booking.mentorName}`,
                time: new Date(booking.date).toISOString(),
                read: false,
                actionUrl: '/booking',
                priority: 'normal',
                sender: { name: booking.mentorName }
              });
            });
          }

          // New ratings for mentors
          if (user.role === 'mentor') {
            const recentRatings = bookings.filter((b: any) => 
              b.status === 'completed' && b.rating && b.rating > 0
            ).slice(0, 3);
            
            recentRatings.forEach((booking: any) => {
              mockNotifications.push({
                id: `rating-received-${booking._id}`,
                type: 'rating',
                title: 'New Rating Received',
                message: `You received a ${booking.rating}-star rating for your session`,
                time: new Date(booking.updatedAt || booking.date).toISOString(),
                read: true,
                actionUrl: '/mentor-dashboard',
                priority: 'low',
                sender: { name: 'Student' }
              });
            });
          }
        }
      } catch (error) {
        console.error('Error loading bookings for notifications:', error);
      }

      mockNotifications.push({
        id: 'welcome',
        type: 'system',
        title: 'Welcome to MentorConnect!',
        message: 'Complete your profile to get started',
        time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        actionUrl: '/profile',
        priority: 'low'
      });

      mockNotifications.sort((a, b) => 
        new Date(b.time).getTime() - new Date(a.time).getTime()
      );

      // Filter out deleted notifications and apply read status from localStorage
      const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
      const deletedNotifications = JSON.parse(localStorage.getItem('deletedNotifications') || '[]');
      
      const filteredNotifications = mockNotifications
        .filter(notif => !deletedNotifications.includes(notif.id))
        .map(notif => ({
          ...notif,
          read: readNotifications.includes(notif.id) ? true : notif.read
        }));

      setNotifications(filteredNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(notif => notif.id === id ? { ...notif, read: true } : notif);
      
      // Persist read status to localStorage
      const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
      if (!readNotifications.includes(id)) {
        readNotifications.push(id);
        localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
      }
      
      return updated;
    });
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, read: true }));
      
      // Persist all read statuses to localStorage
      const readNotifications = updated.map(notif => notif.id);
      localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
      
      return updated;
    });
    toast({ title: "All marked as read" });
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    
    // Also remove from read notifications list
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    const updated = readNotifications.filter((notifId: string) => notifId !== id);
    localStorage.setItem('readNotifications', JSON.stringify(updated));
    
    // Add to deleted notifications list
    const deletedNotifications = JSON.parse(localStorage.getItem('deletedNotifications') || '[]');
    if (!deletedNotifications.includes(id)) {
      deletedNotifications.push(id);
      localStorage.setItem('deletedNotifications', JSON.stringify(deletedNotifications));
    }
    
    toast({ title: "Notification deleted" });
  };

  const handleClearAll = () => {
    // Add all notification IDs to deleted list
    const deletedNotifications = notifications.map(n => n.id);
    localStorage.setItem('deletedNotifications', JSON.stringify(deletedNotifications));
    localStorage.setItem('readNotifications', JSON.stringify([]));
    
    setNotifications([]);
    toast({ title: "All notifications cleared" });
  };

  const handleSave = () => {
    toast({ title: "Notification preferences saved" });
  };

  const getNotificationIcon = (type: string, priority?: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className={`h-5 w-5 ${priority === 'high' ? 'text-orange-500' : 'text-blue-500'}`} />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'rating':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'session':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'system':
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  const getTimeAgo = (timeString: string) => {
    const time = new Date(timeString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <div className="flex-1 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Notification Center</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="ml-2" variant="destructive">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4">
            {/* Actions Bar */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </Button>
                <Button
                  variant={filter === 'read' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('read')}
                >
                  Read ({notifications.length - unreadCount})
                </Button>
              </div>
              {notifications.length > 0 && (
                <div className="flex space-x-2">
                  {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Mark all read
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleClearAll}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    {filter === 'unread' 
                      ? "You're all caught up! No unread notifications."
                      : filter === 'read'
                      ? "No read notifications to show."
                      : "You don't have any notifications yet."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`hover:shadow-md transition-shadow cursor-pointer ${
                      !notification.read ? 'border-l-4 border-l-primary bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      if (!notification.read) handleMarkAsRead(notification.id);
                      if (notification.actionUrl) window.location.href = notification.actionUrl;
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          <div className="bg-muted p-2 rounded-full">
                            {getNotificationIcon(notification.type, notification.priority)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-foreground">{notification.title}</h3>
                              {!notification.read && (
                                <Badge variant="default" className="text-xs">New</Badge>
                              )}
                              {notification.priority === 'high' && (
                                <Badge variant="destructive" className="text-xs">Urgent</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {getTimeAgo(notification.time)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          {notification.sender && (
                            <div className="flex items-center space-x-2 mt-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {notification.sender.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">{notification.sender.name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex space-x-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">

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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Notifications;


