import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Phone, Video, MoreVertical, Paperclip, Smile } from "lucide-react";

const Chat = () => {
  const { mentorId } = useParams();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "mentor",
      content: "Hi Alex! Great to connect with you. I saw your interest in system design. What specific areas would you like to focus on?",
      timestamp: "2:30 PM",
      avatar: "👩‍💻"
    },
    {
      id: 2,
      sender: "student",
      content: "Hi Dr. Johnson! Thank you so much for accepting my request. I'm particularly interested in designing scalable web applications and understanding database architecture patterns.",
      timestamp: "2:32 PM",
      avatar: "👨‍💻"
    },
    {
      id: 3,
      sender: "mentor",
      content: "Perfect! Those are crucial topics. I suggest we start with basic system design principles and then dive into database patterns. Would you like to schedule a video call for our first session?",
      timestamp: "2:35 PM",
      avatar: "👩‍💻"
    },
    {
      id: 4,
      sender: "student",
      content: "That sounds great! I'm available this weekend. Would Saturday afternoon work for you?",
      timestamp: "2:36 PM",
      avatar: "👨‍💻"
    }
  ]);

  // Mock mentor data based on mentorId
  const mentor = {
    name: "Dr. Sarah Johnson",
    domain: "Software Engineering",
    status: "Online",
    avatar: "👩‍💻",
    rating: 4.9,
    experience: "8 years"
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: "student",
        content: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: "👨‍💻"
      };
      setMessages([...messages, newMessage]);
      setMessage("");
      
      // Mock mentor response after a delay
      setTimeout(() => {
        const mentorResponse = {
          id: messages.length + 2,
          sender: "mentor", 
          content: "Thanks for your message! I'll get back to you shortly with some resources.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: "👩‍💻"
        };
        setMessages(prev => [...prev, mentorResponse]);
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="mentor-card h-full flex flex-col">
              {/* Chat Header */}
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-lg">{mentor.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{mentor.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-muted-foreground">{mentor.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[80%] ${msg.sender === 'student' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm">{msg.avatar}</AvatarFallback>
                      </Avatar>
                      <div className={`p-3 rounded-lg ${
                        msg.sender === 'student' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-xs mt-1 opacity-70 ${
                          msg.sender === 'student' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>

              {/* Message Input */}
              <div className="border-t border-border p-4">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    variant="hero" 
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
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
                  <AvatarFallback className="text-3xl">{mentor.avatar}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{mentor.name}</CardTitle>
                <Badge variant="outline">{mentor.domain}</Badge>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <span>⭐</span>
                      <span>{mentor.rating}</span>
                    </div>
                    <div>{mentor.experience} exp</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-card-foreground">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button variant="hero" className="w-full">
                      <Video className="h-4 w-4 mr-2" />
                      Start Video Call
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Phone className="h-4 w-4 mr-2" />
                      Voice Call
                    </Button>
                    <Button variant="outline" className="w-full">
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
      </div>
    </div>
  );
};

export default Chat;