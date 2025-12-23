import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import FindMentors from "./pages/FindMentors";
import About from "./pages/About";
import Chat from "./pages/Chat";
import Messages from "./pages/Messages";
import ChatRequests from "./pages/ChatRequests";
import Profile from "./pages/Profile";
import Booking from "./pages/Booking";
import Progress from "./pages/Progress";
import Blog from "./pages/Blog";
import FileSharing from "./pages/FileSharing";
import NotFound from "./pages/NotFound";
import Verify from "./pages/Verify";
import Notifications from "./pages/Notifications";
import BlogEditor from "./pages/BlogEditor";
import Requests from "./pages/Requests";
import VideoCall from "./pages/VideoCall";
import BlogDetail from "./pages/BlogDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/mentors" element={<FindMentors />} />
            <Route path="/about" element={<About />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/mentor-dashboard" element={<MentorDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogDetail />} />
            <Route path="/blog-editor" element={<BlogEditor />} />
            <Route path="/files" element={<FileSharing />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/chat-requests" element={<ChatRequests />} />
            <Route path="/chat/:mentorId?" element={<Chat />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/video-call" element={<VideoCall />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
