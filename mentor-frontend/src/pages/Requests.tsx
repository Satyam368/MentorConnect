import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Video, Phone, MessageSquare, Plus, Trash2, X } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";

interface Request {
  _id: string;
  mentor: string;
  mentorName: string;
  sessionType: string;
  duration: string;
  date: string;
  time: string;
  notes?: string;
  cost: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

const Requests = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mentors, setMentors] = useState<any[]>([]);
  const { toast } = useToast();

  // Get current user first
  const currentUser = JSON.parse(localStorage.getItem('authUser') || localStorage.getItem('user') || '{}');

  // Initialize socket with currentUser
  const { socket } = useSocket(currentUser?.email);

  // Form state for new request
  const [formData, setFormData] = useState({
    mentorId: "",
    mentorName: "",
    sessionType: "",
    duration: "",
    date: "",
    time: "",
    notes: "",
    cost: 0
  });

  // Fetch user's requests
  const fetchRequests = async () => {
    try {
      if (!currentUser.id) return;

      const response = await fetch(API_ENDPOINTS.BOOKINGS_BY_USER(currentUser.id));
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch requests",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch available mentors
  const fetchMentors = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.MENTORS);
      if (response.ok) {
        const data = await response.json();
        setMentors(data.mentors || []);
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchMentors();
  }, []);

  // Listen for real-time booking status updates
  useEffect(() => {
    if (!socket || !currentUser?.id) return;

    console.log('🔊 Setting up booking status listener in Requests page');

    const handleBookingStatusUpdate = (data: any) => {
      console.log('📢 Booking status updated:', data);

      // Only process for mentees/students, not mentors
      if (currentUser.role === 'mentor') {
        return; // Mentors use this page differently
      }

      // Show notification to mentee
      const action = data.action === 'accepted' ? 'accepted' : 'declined';
      toast({
        title: `Session ${action}!`,
        description: `${data.mentorName} has ${action} your session request.`,
        variant: data.action === 'accepted' ? 'default' : 'destructive'
      });

      // Refresh the requests list
      fetchRequests();
    };

    const handleNewSessionRequest = (data: any) => {
      console.log('📢 New session request received:', data);

      // Only process for mentors
      if (currentUser.role !== 'mentor') {
        return;
      }

      // Show notification to mentor
      toast({
        title: "New Session Request!",
        description: `New session request for ${data.sessionType} - ${data.duration}`,
      });

      // Refresh the requests list
      fetchRequests();

      // Dispatch event to update notification count
      window.dispatchEvent(new Event('notificationUpdate'));
    };

    socket.on('booking-status-updated', handleBookingStatusUpdate);
    socket.on('new-session-request', handleNewSessionRequest);

    return () => {
      console.log('🧹 Cleaning up booking status listener');
      socket.off('new-session-request', handleNewSessionRequest);
      socket.off('booking-status-updated', handleBookingStatusUpdate);
    };
  }, [socket, currentUser, toast]);

  // Handle form submission for new request
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser.id) {
      toast({
        title: "Error",
        description: "Please log in to create a request",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.BOOKINGS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          mentorId: formData.mentorId,
          mentorName: formData.mentorName,
          sessionType: formData.sessionType,
          duration: formData.duration,
          date: formData.date,
          time: formData.time,
          notes: formData.notes,
          cost: formData.cost
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Request created successfully",
        });
        setIsDialogOpen(false);
        setFormData({
          mentorId: "",
          mentorName: "",
          sessionType: "",
          duration: "",
          date: "",
          time: "",
          notes: "",
          cost: 0
        });
        fetchRequests(); // Refresh the list
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create request",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Error",
        description: "Failed to create request",
        variant: "destructive",
      });
    }
  };

  // Handle request deletion
  const handleDeleteRequest = async (requestId: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.BOOKING_BY_ID(requestId), {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Request deleted successfully",
        });
        fetchRequests(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: "Failed to delete request",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request",
        variant: "destructive",
      });
    }
  };

  // Format date and time for display
  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(date);
    return `${dateObj.toLocaleDateString()} ${time}`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default'; // Green/success for accepted
      case 'pending': return 'secondary'; // Yellow/warning for pending
      case 'cancelled': return 'destructive'; // Red for cancelled
      case 'completed': return 'outline'; // Gray for completed
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-muted/30 pt-20 lg:pt-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Session Requests</h1>
            <p className="text-muted-foreground">Track the status of your mentoring requests</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Session Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div>
                  <Label htmlFor="mentorName">Mentor</Label>
                  <Select value={formData.mentorName} onValueChange={(value) => setFormData({ ...formData, mentorName: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a mentor" />
                    </SelectTrigger>
                    <SelectContent>
                      {mentors.map((mentor) => (
                        <SelectItem key={mentor._id} value={mentor.name}>
                          {mentor.name} - {mentor.company || 'General Mentoring'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sessionType">Session Type</Label>
                  <Select value={formData.sessionType} onValueChange={(value) => setFormData({ ...formData, sessionType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Video Call">Video Call</SelectItem>
                      <SelectItem value="Phone Call">Phone Call</SelectItem>
                      <SelectItem value="Messaging">Messaging</SelectItem>
                      <SelectItem value="In-Person">In-Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30 min">30 minutes</SelectItem>
                      <SelectItem value="45 min">45 minutes</SelectItem>
                      <SelectItem value="60 min">60 minutes</SelectItem>
                      <SelectItem value="90 min">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cost">Cost ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter session cost"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes or topics you'd like to discuss..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Request
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {requests.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No requests yet</h3>
                <p className="text-muted-foreground mb-4">Create your first session request to get started</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Request
                </Button>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card
                key={request._id}
                className={`mentor-card ${request.status === 'confirmed' ? 'border-l-4 border-l-green-500 bg-green-50/50' :
                    request.status === 'cancelled' ? 'opacity-60' : ''
                  }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{request.mentorName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status === 'confirmed' ? '✓ Confirmed' :
                          request.status === 'pending' ? 'Pending' :
                            request.status === 'cancelled' ? 'Declined' :
                              request.status}
                      </Badge>
                      {(request.status === 'pending' || request.status === 'cancelled') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRequest(request._id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      {request.sessionType === 'Video Call' ? <Video className="h-4 w-4 mr-2" /> :
                        request.sessionType === 'Phone Call' ? <Phone className="h-4 w-4 mr-2" /> :
                          <MessageSquare className="h-4 w-4 mr-2" />}
                      {request.sessionType}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" /> {request.duration}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" /> {formatDateTime(request.date, request.time)}
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">${request.cost}</span>
                    </div>
                  </div>

                  {request.notes && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {request.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      <div>Requested: {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      {request.status === 'confirmed' && request.updatedAt && (
                        <div className="mt-1 text-green-600 font-medium">
                          ✓ Accepted on {new Date(request.updatedAt).toLocaleDateString()} at {new Date(request.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {request.status === 'cancelled' && request.updatedAt && (
                        <div className="mt-1 text-red-600 font-medium">
                          ✗ Declined on {new Date(request.updatedAt).toLocaleDateString()} at {new Date(request.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {request.status === 'pending' && (
                        <Button variant="outline" size="sm" onClick={() => handleDeleteRequest(request._id)}>
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                      {request.status === 'confirmed' && (
                        <>
                          {/* Check if session date has passed */}
                          {new Date(request.date) < new Date() ? (
                            <Button variant="default" size="sm" onClick={() => window.location.href = `/video-call?recording=${request._id}`}>
                              <Video className="h-4 w-4 mr-1" />
                              View Recording
                            </Button>
                          ) : (
                            <Button variant="default" size="sm" onClick={() => window.location.href = '/booking'}>
                              <Calendar className="h-4 w-4 mr-1" />
                              View Session
                            </Button>
                          )}
                        </>
                      )}
                      {request.status === 'completed' && (
                        <Button variant="default" size="sm" onClick={() => window.location.href = `/video-call?recording=${request._id}`}>
                          <Video className="h-4 w-4 mr-1" />
                          View Recording
                        </Button>
                      )}
                      <Button variant="hero" size="sm" onClick={() => window.location.href = `/chat/${request.mentor}`}>
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message Mentor
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Requests;


