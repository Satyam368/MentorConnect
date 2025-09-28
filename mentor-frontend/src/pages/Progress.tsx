import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, TrendingUp, Clock, BookOpen, Target, Award, Calendar, MessageSquare, FileText } from "lucide-react";

const Progress = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  // Mock progress data
  const progressStats = {
    totalSessions: 24,
    completedHours: 36,
    averageRating: 4.7,
    skillsImproved: 8,
    goalsAchieved: 5,
    totalGoals: 7,
    currentStreak: 12,
    longestStreak: 18
  };

  const skillProgress = [
    { skill: "React Development", current: 85, target: 90, sessions: 8 },
    { skill: "System Design", current: 70, target: 85, sessions: 6 },
    { skill: "Node.js", current: 75, target: 80, sessions: 5 },
    { skill: "Database Design", current: 60, target: 75, sessions: 3 },
    { skill: "Leadership", current: 45, target: 70, sessions: 2 }
  ];

  const sessionHistory = [
    {
      id: 1,
      mentor: "Dr. Sarah Johnson",
      date: "Dec 20, 2024",
      duration: "60 min",
      topic: "React Hooks Deep Dive",
      rating: 5,
      feedback: "Excellent session! Sarah explained complex concepts very clearly.",
      skillsFocused: ["React", "JavaScript"],
      avatar: "👩‍💻"
    },
    {
      id: 2,
      mentor: "Marcus Chen",
      date: "Dec 18, 2024",
      duration: "45 min",
      topic: "System Architecture Patterns",
      rating: 4,
      feedback: "Great insights into microservices architecture.",
      skillsFocused: ["System Design", "Architecture"],
      avatar: "👨‍🔬"
    },
    {
      id: 3,
      mentor: "Elena Rodriguez",
      date: "Dec 15, 2024",
      duration: "60 min",
      topic: "User Experience Principles",
      rating: 5,
      feedback: "Very practical session with real-world examples.",
      skillsFocused: ["UX Design", "User Research"],
      avatar: "👩‍🎨"
    }
  ];

  const learningGoals = [
    {
      id: 1,
      title: "Master React Advanced Patterns",
      description: "Learn render props, higher-order components, and custom hooks",
      progress: 85,
      target: 100,
      deadline: "Jan 31, 2025",
      status: "in-progress",
      relatedSessions: 8
    },
    {
      id: 2,
      title: "Build Full-Stack Application",
      description: "Create a complete application with authentication and database",
      progress: 60,
      target: 100,
      deadline: "Feb 28, 2025",
      status: "in-progress",
      relatedSessions: 5
    },
    {
      id: 3,
      title: "Learn System Design Fundamentals",
      description: "Understand scalability, load balancing, and database design",
      progress: 100,
      target: 100,
      deadline: "Dec 15, 2024",
      status: "completed",
      relatedSessions: 6
    }
  ];

  const achievements = [
    { title: "First Session", description: "Completed your first mentoring session", date: "Nov 5, 2024", icon: "🎯" },
    { title: "Consistent Learner", description: "Attended sessions for 10 consecutive weeks", date: "Dec 10, 2024", icon: "🔥" },
    { title: "Skill Master", description: "Achieved 90% proficiency in React", date: "Dec 15, 2024", icon: "⭐" },
    { title: "Goal Achiever", description: "Completed 5 learning goals", date: "Dec 18, 2024", icon: "🏆" }
  ];

  return (
    <div className="flex-1 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Learning Progress</h1>
          <p className="text-muted-foreground">Track your mentoring journey and skill development</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="mentor-card">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-primary/10 p-3 rounded-full">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">{progressStats.totalSessions}</p>
                  <p className="text-muted-foreground text-sm">Total Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mentor-card">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-secondary/10 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">{progressStats.completedHours}</p>
                  <p className="text-muted-foreground text-sm">Hours Learned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mentor-card">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">{progressStats.averageRating}</p>
                  <p className="text-muted-foreground text-sm">Avg Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mentor-card">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">{progressStats.currentStreak}</p>
                  <p className="text-muted-foreground text-sm">Week Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="skills" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="skills">Skills Progress</TabsTrigger>
            <TabsTrigger value="goals">Learning Goals</TabsTrigger>
            <TabsTrigger value="history">Session History</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Skills Progress */}
          <TabsContent value="skills" className="space-y-6">
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Skills Development
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {skillProgress.map((skill, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{skill.skill}</h4>
                      <span className="text-sm text-muted-foreground">
                        {skill.current}% / {skill.target}%
                      </span>
                    </div>
                    <ProgressBar value={skill.current} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{skill.sessions} sessions completed</span>
                      <span>{skill.target - skill.current}% to goal</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Learning Goals */}
          <TabsContent value="goals" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {learningGoals.map((goal) => (
                <Card key={goal.id} className="mentor-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <Badge 
                        variant={goal.status === "completed" ? "default" : "secondary"}
                      >
                        {goal.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <ProgressBar value={goal.progress} />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Deadline: {goal.deadline}</span>
                      <span>{goal.relatedSessions} sessions</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Session History */}
          <TabsContent value="history" className="space-y-6">
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {sessionHistory.map((session) => (
                  <div key={session.id} className="border-l-4 border-primary/20 pl-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>{session.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{session.mentor}</h4>
                          <p className="text-sm text-muted-foreground">{session.date} • {session.duration}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < session.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <h5 className="font-medium text-foreground">{session.topic}</h5>
                    <p className="text-sm text-muted-foreground">{session.feedback}</p>
                    <div className="flex flex-wrap gap-2">
                      {session.skillsFocused.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {achievements.map((achievement, index) => (
                <Card key={index} className="mentor-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                        <p className="text-xs text-muted-foreground">Earned on {achievement.date}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Progress;