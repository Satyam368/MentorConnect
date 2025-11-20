import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Monitor, 
  MessageSquare,
  Users,
  Settings,
  Maximize2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VideoCall = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const roomId = searchParams.get('room');
  const userName = searchParams.get('name');
  const userType = searchParams.get('type');
  
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [participants, setParticipants] = useState<string[]>([userName || 'You']);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format duration as HH:MM:SS
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    toast({
      title: isVideoOn ? "Camera Off" : "Camera On",
      description: isVideoOn ? "Your camera has been turned off" : "Your camera has been turned on",
    });
  };

  const handleToggleAudio = () => {
    setIsAudioOn(!isAudioOn);
    toast({
      title: isAudioOn ? "Microphone Muted" : "Microphone Unmuted",
      description: isAudioOn ? "Your microphone has been muted" : "Your microphone has been unmuted",
    });
  };

  const handleToggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    toast({
      title: isScreenSharing ? "Screen Share Stopped" : "Screen Share Started",
      description: isScreenSharing ? "You stopped sharing your screen" : "You are now sharing your screen",
    });
  };

  const handleEndCall = () => {
    toast({
      title: "Session Ended",
      description: `Session duration: ${formatDuration(sessionDuration)}`,
    });
    navigate(-1); // Go back to dashboard
  };

  if (!roomId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Session</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No room ID provided. Please join from a valid session link.
            </p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Badge variant="destructive" className="animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
              LIVE
            </Badge>
            <div className="text-white">
              <p className="font-medium">{userType === 'mentor' ? 'Mentor' : 'Student'} Session</p>
              <p className="text-sm text-gray-400">Room: {roomId}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-white text-center">
              <p className="text-2xl font-bold font-mono">{formatDuration(sessionDuration)}</p>
              <p className="text-xs text-gray-400">Session Duration</p>
            </div>
            
            <div className="flex items-center space-x-2 text-white">
              <Users className="h-5 w-5" />
              <span>{participants.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Video Area */}
        <div className="flex-1 p-4">
          <div className="h-full grid grid-cols-1 gap-4">
            {/* Main Video Display */}
            <Card className="relative bg-gray-900 border-gray-700 overflow-hidden">
              <CardContent className="p-0 h-full flex items-center justify-center">
                {isVideoOn ? (
                  <div className="relative w-full h-full bg-gradient-to-br from-gray-800 to-gray-900">
                    {/* Placeholder for video stream */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Video className="h-24 w-24 mx-auto mb-4 text-gray-600" />
                        <p className="text-xl font-medium">{userName}</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Video stream would appear here
                        </p>
                        <p className="text-xs text-gray-500 mt-4">
                          In production, integrate with Zoom, Google Meet, or Jitsi
                        </p>
                      </div>
                    </div>
                    
                    {/* Participant Label */}
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
                      <p className="text-white text-sm font-medium">{userName} (You)</p>
                    </div>

                    {/* Screen Share Indicator */}
                    {isScreenSharing && (
                      <div className="absolute top-4 left-4 bg-green-500 px-3 py-1 rounded-full">
                        <p className="text-white text-xs font-medium flex items-center">
                          <Monitor className="h-3 w-3 mr-1" />
                          Sharing Screen
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-white">
                    <VideoOff className="h-24 w-24 text-gray-600 mb-4" />
                    <p className="text-xl font-medium">Camera is off</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar - Chat/Participants */}
        <div className="w-80 bg-gray-900 border-l border-gray-700 p-4 overflow-y-auto">
          <Card className="bg-gray-800 border-gray-700 mb-4">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {participant.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{participant}</p>
                    <p className="text-gray-400 text-xs">{index === 0 ? 'You' : 'Student'}</p>
                  </div>
                  <Badge variant={isAudioOn ? "default" : "secondary"} className="text-xs">
                    {isAudioOn ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Session Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-700/50 rounded-lg p-3 text-gray-300 text-sm">
                <p>• Record important points</p>
                <p className="mt-2">• Share resources</p>
                <p className="mt-2">• Track progress</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Control Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-md border-t border-white/10 px-6 py-4">
        <div className="flex items-center justify-center space-x-4 max-w-2xl mx-auto">
          <Button
            variant={isVideoOn ? "default" : "destructive"}
            size="lg"
            onClick={handleToggleVideo}
            className="rounded-full w-14 h-14"
          >
            {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>

          <Button
            variant={isAudioOn ? "default" : "destructive"}
            size="lg"
            onClick={handleToggleAudio}
            className="rounded-full w-14 h-14"
          >
            {isAudioOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>

          <Button
            variant={isScreenSharing ? "secondary" : "outline"}
            size="lg"
            onClick={handleToggleScreenShare}
            className="rounded-full w-14 h-14"
          >
            <Monitor className="h-6 w-6" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-14 h-14"
          >
            <Settings className="h-6 w-6" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-14 h-14"
          >
            <Maximize2 className="h-6 w-6" />
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={handleEndCall}
            className="rounded-full w-16 h-16 ml-4"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>

        <div className="text-center mt-3">
          <p className="text-white text-xs">
            End Call to return to dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
