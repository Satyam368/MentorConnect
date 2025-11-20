import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Send, Phone, Video, MoreVertical, Paperclip, Smile, AlertCircle, ArrowLeft } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/useSocket";

interface Message {
  id?: string;
  _id?: string;
  sender: string;
  receiver: string;
  content: string;
  timestamp: string | Date;
  read?: boolean;
  type?: string;
}

interface Mentor {
  email: string;
  name: string;
  domain: string;
  status: string;
  avatar?: string;
  rating?: number;
  experience?: string;
  totalSessions?: number;
  averageRating?: number;
}

const Chat = () => {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [chatAccessDenied, setChatAccessDenied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user
  useEffect(() => {
    const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
    }
  }, []);

  // Initialize socket connection
  const { socket, isConnected, onlineUsers } = useSocket(currentUser?.email);

  useEffect(() => {
    // Fetch mentor details and chat history
    const fetchChatData = async () => {
      if (!currentUser || !mentorId) return;
      
      try {
        setIsLoading(true);
        
        // Check chat permission first
        const permissionResponse = await fetch(
          API_ENDPOINTS.CHAT_PERMISSION_CHECK(currentUser.email, mentorId)
        );
        const permissionData = await permissionResponse.json();
        
        if (!permissionData.canChat) {
          setChatAccessDenied(true);
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You don't have permission to chat with this mentor. Please send a chat request first."
          });
          // Redirect back after showing error
          setTimeout(() => {
            const previousPage = localStorage.getItem('previousPage') || '/mentors';
            navigate(previousPage, { replace: true });
          }, 2000);
          return;
        }
        
        // Fetch mentor details
        const mentorResponse = await fetch(API_ENDPOINTS.PROFILE_BY_EMAIL(mentorId));
        if (mentorResponse.ok) {
          const mentorData = await mentorResponse.json();
          setMentor(mentorData);
        }

        // Fetch chat history
        const chatResponse = await fetch(
          API_ENDPOINTS.CHAT_CONVERSATION(currentUser.email, mentorId)
        );
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          setMessages(chatData);
          
          // Mark messages as read
          const conversationId = [currentUser.email, mentorId].sort().join('_');
          await fetch(API_ENDPOINTS.CHAT_MARK_READ, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId,
              userId: currentUser.email
            })
          });
          
          // Trigger notification count update
          window.dispatchEvent(new Event('notificationUpdate'));
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load chat data"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatData();
  }, [currentUser, mentorId, toast]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !socket.connected) {
      console.log('Socket not ready:', { socket: !!socket, connected: socket?.connected });
      return;
    }

    console.log('Setting up socket listeners for chat');

    // Listen for incoming messages
    const handleReceiveMessage = (data: Message) => {
      console.log('📨 Received message:', data);
      setMessages((prev) => {
        // Check if message already exists
        const exists = prev.some(m => 
          (m._id && m._id === data._id) || 
          (m.id && m.id === data.id)
        );
        if (exists) {
          console.log('Message already exists, skipping');
          return prev;
        }
        return [...prev, data];
      });
      scrollToBottom();
    };

    // Listen for message sent confirmation
    const handleMessageSent = (data: Message) => {
      console.log('✅ Message sent confirmed:', data);
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && !lastMsg._id && !lastMsg.id && lastMsg.content === data.content) {
          updated[updated.length - 1] = data;
        }
        return updated;
      });
      scrollToBottom();
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('message-sent', handleMessageSent);

    // Listen for typing indicator
    socket.on('user-typing', ({ userId }) => {
      if (userId === mentorId) {
        setIsTyping(true);
      }
    });

    socket.on('user-stop-typing', ({ userId }) => {
      if (userId === mentorId) {
        setIsTyping(false);
      }
    });

    // Listen for errors
    const handleMessageError = ({ error }: { error: string }) => {
      console.error('❌ Message error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error || "Failed to send message"
      });
    };

    socket.on('message-error', handleMessageError);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('message-sent', handleMessageSent);
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('message-error', handleMessageError);
    };
  }, [socket, socket?.connected, mentorId, toast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !socket || !currentUser || !mentorId) {
      console.log('Cannot send message:', {
        hasMessage: !!message.trim(),
        hasSocket: !!socket,
        socketConnected: socket?.connected,
        hasCurrentUser: !!currentUser,
        hasMentorId: !!mentorId
      });
      return;
    }

    const newMessage: Message = {
      sender: currentUser.email,
      receiver: mentorId,
      content: message.trim(),
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Sending message:', newMessage);
    
    // Optimistically add message to UI
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
    
    // Send via socket
    socket.emit('send-message', {
      sender: currentUser.email,
      receiver: mentorId,
      content: newMessage.content,
      type: 'text'
    });

    // Stop typing indicator
    socket.emit('stop-typing', { receiver: mentorId });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (!socket || !mentorId) return;

    // Send typing indicator
    socket.emit('typing', { receiver: mentorId });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { receiver: mentorId });
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOnline = mentor ? onlineUsers.has(mentor.email) : false;

  return (
    <div className="flex-1 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const previousPage = localStorage.getItem('previousPage') || '/mentors';
              navigate(previousPage);
            }}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connecting to chat server...</AlertTitle>
            <AlertDescription>
              Please wait while we establish a connection.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Access Denied Message */}
        {chatAccessDenied && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to chat with this mentor. Redirecting you back...
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            {/* Chat Area */}
            <div className="lg:col-span-3">
              <Card className="mentor-card h-full flex flex-col">
                {/* Chat Header */}
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-lg">
                          {mentor ? getInitials(mentor.name) : '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {mentor?.name || 'Mentor'}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-sm text-muted-foreground">
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" disabled>
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" disabled>
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" disabled>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => {
                      const isCurrentUser = msg.sender === currentUser?.email;
                      return (
                        <div
                          key={msg._id || msg.id || index}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-start space-x-2 max-w-[80%] ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-sm">
                                {isCurrentUser ? 'ME' : (mentor ? getInitials(mentor.name) : '??')}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`p-3 rounded-lg ${
                              isCurrentUser
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                              <p className={`text-xs mt-1 opacity-70 ${
                                isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}>
                                {formatTimestamp(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-2 max-w-[80%]">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-sm">
                              {mentor ? getInitials(mentor.name) : '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="p-3 rounded-lg bg-muted">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </CardContent>

              {/* Message Input */}
              <div className="border-t border-border p-4">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" disabled>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type your message..."
                      value={message}
                      onChange={handleTyping}
                      onKeyPress={handleKeyPress}
                      className="pr-10"
                      disabled={!isConnected}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      disabled
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    variant="hero" 
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!message.trim() || !isConnected}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Mentor Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="mentor-card">
              <CardHeader className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarFallback className="text-3xl">
                    {mentor ? getInitials(mentor.name) : '??'}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{mentor?.name || 'Mentor'}</CardTitle>
                <Badge variant="outline">{mentor?.domain || 'N/A'}</Badge>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {mentor && (
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <span>⭐</span>
                        <span>{mentor.averageRating?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <div>{mentor.totalSessions || 0} sessions</div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="font-semibold text-card-foreground">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button variant="hero" className="w-full" disabled={!isConnected}>
                      <Video className="h-4 w-4 mr-2" />
                      Start Video Call
                    </Button>
                    <Button variant="outline" className="w-full" disabled={!isConnected}>
                      <Phone className="h-4 w-4 mr-2" />
                      Voice Call
                    </Button>
                    <Button variant="outline" className="w-full" disabled={!isConnected}>
                      Schedule Session
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-card-foreground">Shared Files</h4>
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No shared files yet</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Chat;