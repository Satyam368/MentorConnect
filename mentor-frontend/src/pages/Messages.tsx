import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Clock, ArrowRight, Circle } from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/useSocket";

interface Conversation {
  _id: string;
  lastMessage: {
    sender: string;
    receiver: string;
    content: string;
    timestamp: string;
    read: boolean;
  };
  unreadCount: number;
  otherUser: {
    email: string;
    name: string;
    avatar?: string;
    role: string;
  };
}

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { socket, onlineUsers } = useSocket(currentUser?.email);

  useEffect(() => {
    const userData = localStorage.getItem('authUser') || localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      loadConversations(user);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Listen for new messages and update conversations
  useEffect(() => {
    if (!socket || !currentUser) {
      console.log('⚠️ Socket or currentUser not ready:', { socket: !!socket, currentUser: !!currentUser });
      return;
    }

    console.log('🔊 Setting up socket listeners for Messages page');

    const handleNewMessage = (message: any) => {
      console.log('📬 New message received in Messages page:', message);
      console.log('🔄 Reloading conversations...');
      
      // Reload conversations to get updated list
      loadConversations(currentUser);
    };

    const handleChatNotification = (data: any) => {
      console.log('🔔 Chat notification received in Messages page:', data);
      console.log('🔄 Reloading conversations...');
      
      // Reload conversations
      loadConversations(currentUser);
    };

    socket.on('receive-message', handleNewMessage);
    socket.on('new-chat-notification', handleChatNotification);

    console.log('✅ Socket listeners set up successfully');

    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket.off('receive-message', handleNewMessage);
      socket.off('new-chat-notification', handleChatNotification);
    };
  }, [socket, currentUser]);

  const loadConversations = async (user: any) => {
    try {
      setIsLoading(true);
      
      console.log('📝 Loading conversations for user:', user.email);
      
      // Fetch all conversations
      const response = await fetch(API_ENDPOINTS.CHAT_CONVERSATIONS(user.email));
      
      console.log('📊 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }

      const data = await response.json();
      console.log('📦 Raw conversations data:', data);
      console.log('📊 Number of conversations:', data.length);
      
      // Fetch user details for each conversation
      const conversationsWithUsers = await Promise.all(
        data.map(async (conv: any) => {
          const conversationId = conv._id;
          console.log('🔑 Processing conversation ID:', conversationId);
          const [user1, user2] = conversationId.split('_');
          const otherUserEmail = user1 === user.email ? user2 : user1;
          console.log('👤 Other user email:', otherUserEmail);
          
          try {
            const userResponse = await fetch(API_ENDPOINTS.PROFILE_BY_EMAIL(otherUserEmail));
            if (userResponse.ok) {
              const userData = await userResponse.json();
              console.log('✅ Got user data for:', otherUserEmail, userData);
              return {
                ...conv,
                otherUser: {
                  email: otherUserEmail,
                  name: userData.name || otherUserEmail,
                  avatar: userData.profilePicture,
                  role: userData.role || 'student'
                }
              };
            }
          } catch (error) {
            console.error('❌ Error fetching user details:', error);
          }
          
          return {
            ...conv,
            otherUser: {
              email: otherUserEmail,
              name: otherUserEmail,
              role: 'student'
            }
          };
        })
      );
      
      console.log('✅ Final conversations with users:', conversationsWithUsers);
      setConversations(conversationsWithUsers);
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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

  const handleOpenChat = (otherUserEmail: string) => {
    localStorage.setItem('previousPage', '/messages');
    navigate(`/chat/${otherUserEmail}`);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex-1 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading conversations...</p>
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Messages</h1>
                <p className="text-sm text-muted-foreground">
                  {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="space-y-3">
          {filteredConversations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? 'No conversations found' : 'No messages yet'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Try a different search term' 
                    : currentUser?.role === 'mentor' 
                      ? 'Students will appear here when they message you'
                      : 'Start a conversation with a mentor'
                  }
                </p>
                {!searchQuery && currentUser?.role === 'student' && (
                  <Button onClick={() => navigate('/mentors')}>
                    Find Mentors
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredConversations.map((conversation) => (
              <Card
                key={conversation._id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  conversation.unreadCount > 0 ? 'border-l-4 border-l-primary bg-primary/5' : ''
                }`}
                onClick={() => handleOpenChat(conversation.otherUser.email)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        {conversation.otherUser.avatar && (
                          <AvatarImage 
                            src={`${API_BASE_URL}${conversation.otherUser.avatar}`}
                            alt={conversation.otherUser.name}
                          />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(conversation.otherUser.name)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online Status Indicator */}
                      {onlineUsers.has(conversation.otherUser.email) && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">
                            {conversation.otherUser.name}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {conversation.otherUser.role === 'mentor' ? '🎓 Mentor' : '📚 Student'}
                          </Badge>
                          {onlineUsers.has(conversation.otherUser.email) && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-300">
                              <Circle className="h-2 w-2 mr-1 fill-green-500" />
                              Online
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          <div className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimestamp(conversation.lastMessage.timestamp)}
                          </div>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className={`text-sm truncate ${
                        conversation.unreadCount > 0 
                          ? 'text-foreground font-medium' 
                          : 'text-muted-foreground'
                      }`}>
                        {conversation.lastMessage.sender === currentUser?.email 
                          ? 'You: ' 
                          : ''
                        }
                        {conversation.lastMessage.content}
                      </p>
                    </div>

                    {/* Arrow */}
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
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

export default Messages;
