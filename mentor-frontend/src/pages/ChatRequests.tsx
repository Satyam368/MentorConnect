import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Check, X, Clock, AlertCircle } from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/useSocket";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatRequest {
  _id: string;
  sender: string;
  receiver: string;
  message: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
  respondedAt?: string;
  senderDetails?: {
    name: string;
    email: string;
    profilePicture?: string;
    role: string;
  };
}

const ChatRequests = () => {
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<ChatRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'decline' | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { socket } = useSocket(currentUser?.email);

  useEffect(() => {
    const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      loadRequests(user);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Listen for new chat requests via socket
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleNewChatRequest = (data: any) => {
      console.log('🔔 New chat request received:', data);
      toast({
        title: "New Chat Request",
        description: `${data.senderName || 'Someone'} wants to chat with you`,
      });
      loadRequests(currentUser);
    };

    socket.on('new-chat-request', handleNewChatRequest);

    return () => {
      socket.off('new-chat-request', handleNewChatRequest);
    };
  }, [socket, currentUser]);

  const loadRequests = async (user: any) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(API_ENDPOINTS.CHAT_REQUEST_ALL(user.email));
      
      if (!response.ok) {
        throw new Error('Failed to load chat requests');
      }

      const data = await response.json();
      
      // Fetch sender details for each request
      const requestsWithDetails = await Promise.all(
        data.map(async (request: ChatRequest) => {
          try {
            const userEmail = request.sender === user.email ? request.receiver : request.sender;
            const userResponse = await fetch(API_ENDPOINTS.PROFILE_BY_EMAIL(userEmail));
            if (userResponse.ok) {
              const userData = await userResponse.json();
              return {
                ...request,
                senderDetails: {
                  name: userData.name,
                  email: userEmail,
                  profilePicture: userData.profilePicture,
                  role: userData.role
                }
              };
            }
          } catch (error) {
            console.error('Error fetching user details:', error);
          }
          
          return {
            ...request,
            senderDetails: {
              name: request.sender === user.email ? request.receiver : request.sender,
              email: request.sender === user.email ? request.receiver : request.sender,
              role: 'student'
            }
          };
        })
      );
      
      setRequests(requestsWithDetails);
    } catch (error) {
      console.error('Error loading chat requests:', error);
      toast({
        title: "Error",
        description: "Failed to load chat requests",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (request: ChatRequest) => {
    try {
      const response = await fetch(API_ENDPOINTS.CHAT_REQUEST_APPROVE(request._id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to approve request');
      }

      toast({
        title: "Request Approved",
        description: "You can now chat with this user",
      });

      // Emit socket event to notify the sender
      if (socket) {
        socket.emit('chat-request-response', {
          requestId: request._id,
          sender: request.sender,
          receiver: request.receiver,
          status: 'approved'
        });
      }

      loadRequests(currentUser);
      setSelectedRequest(null);
      setActionType(null);
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive"
      });
    }
  };

  const handleDecline = async (request: ChatRequest) => {
    try {
      const response = await fetch(API_ENDPOINTS.CHAT_REQUEST_DECLINE(request._id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to decline request');
      }

      toast({
        title: "Request Declined",
        description: "The chat request has been declined",
      });

      // Emit socket event to notify the sender
      if (socket) {
        socket.emit('chat-request-response', {
          requestId: request._id,
          sender: request.sender,
          receiver: request.receiver,
          status: 'declined'
        });
      }

      loadRequests(currentUser);
      setSelectedRequest(null);
      setActionType(null);
    } catch (error) {
      console.error('Error declining request:', error);
      toast({
        title: "Error",
        description: "Failed to decline request",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending' && r.receiver === currentUser?.email);
  const sentRequests = requests.filter(r => r.sender === currentUser?.email);
  const processedRequests = requests.filter(r => r.status !== 'pending' && r.receiver === currentUser?.email);

  if (isLoading) {
    return (
      <div className="flex-1 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading chat requests...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Chat Requests</h1>
              <p className="text-sm text-muted-foreground">
                {pendingRequests.length > 0 
                  ? `${pendingRequests.length} pending request${pendingRequests.length > 1 ? 's' : ''}`
                  : 'No pending requests'}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-500" />
              Pending Requests
            </h2>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <Card key={request._id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        {request.senderDetails?.profilePicture && (
                          <AvatarImage 
                            src={`${API_BASE_URL}${request.senderDetails.profilePicture}`}
                            alt={request.senderDetails.name}
                          />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(request.senderDetails?.name || '')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-foreground">
                            {request.senderDetails?.name}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(request.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {request.senderDetails?.email}
                        </p>
                        {request.message && (
                          <p className="text-sm text-foreground mb-3 bg-muted/50 p-2 rounded">
                            "{request.message}"
                          </p>
                        )}
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionType('approve');
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionType('decline');
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Sent Requests */}
        {sentRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Sent Requests</h2>
            <div className="space-y-3">
              {sentRequests.map((request) => (
                <Card key={request._id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          {request.senderDetails?.profilePicture && (
                            <AvatarImage 
                              src={`${API_BASE_URL}${request.senderDetails.profilePicture}`}
                              alt={request.senderDetails.name}
                            />
                          )}
                          <AvatarFallback>
                            {getInitials(request.senderDetails?.name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.senderDetails?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(request.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          request.status === 'approved' ? 'default' :
                          request.status === 'declined' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Processed Requests</h2>
            <div className="space-y-3">
              {processedRequests.map((request) => (
                <Card key={request._id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          {request.senderDetails?.profilePicture && (
                            <AvatarImage 
                              src={`${API_BASE_URL}${request.senderDetails.profilePicture}`}
                              alt={request.senderDetails.name}
                            />
                          )}
                          <AvatarFallback>
                            {getInitials(request.senderDetails?.name || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.senderDetails?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(request.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={request.status === 'approved' ? 'default' : 'destructive'}
                        >
                          {request.status}
                        </Badge>
                        {request.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              localStorage.setItem('previousPage', '/chat-requests');
                              navigate(`/chat/${request.sender}`);
                            }}
                          >
                            Open Chat
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {requests.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Chat Requests</h3>
              <p className="text-sm text-muted-foreground">
                You don't have any chat requests yet
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedRequest && !!actionType} onOpenChange={() => {
        setSelectedRequest(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Approve Chat Request?' : 'Decline Chat Request?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' 
                ? `You are about to approve the chat request from ${selectedRequest?.senderDetails?.name}. You will be able to exchange messages with them.`
                : `You are about to decline the chat request from ${selectedRequest?.senderDetails?.name}. They will not be able to message you.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedRequest) {
                  if (actionType === 'approve') {
                    handleApprove(selectedRequest);
                  } else {
                    handleDecline(selectedRequest);
                  }
                }
              }}
              className={actionType === 'decline' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {actionType === 'approve' ? 'Approve' : 'Decline'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatRequests;
