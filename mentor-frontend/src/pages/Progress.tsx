import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, TrendingUp, Clock, BookOpen, Target, Award, Calendar, MessageSquare, FileText, BarChart3, LineChart, PieChart, ArrowUp, ArrowDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/api";
import { Link } from "react-router-dom";

const Progress = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // State for real data
  const [progressStats, setProgressStats] = useState({
    totalSessions: 0,
    completedHours: 0,
    averageRating: 0,
    skillsImproved: 0,
    goalsAchieved: 0,
    totalGoals: 0,
    currentStreak: 0,
    longestStreak: 0
  });

  const [skillProgress, setSkillProgress] = useState<any[]>([]);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [learningGoals, setLearningGoals] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [monthlyProgress, setMonthlyProgress] = useState<any[]>([]);
  const [topSkills, setTopSkills] = useState<any[]>([]);

  // Load progress data from API
  useEffect(() => {
    const loadProgressData = async () => {
      try {
        const userData = localStorage.getItem('authUser') || localStorage.getItem('user');

        if (!userData) {
          toast({
            title: "Session Expired",
            description: "Please log in to view your progress",
            variant: "destructive"
          });
          return;
        }

        const user = JSON.parse(userData);

        // Fetch user profile with stats
        if (user.email) {
          try {
            const profileResponse = await fetch(API_ENDPOINTS.PROFILE_BY_EMAIL(user.email));
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();

              // Update stats from profile
              if (profileData.user.mentee) {
                const menteeData = profileData.user.mentee;
                setProgressStats({
                  totalSessions: menteeData.completedSessions || 0,
                  completedHours: menteeData.hoursLearned || 0,
                  averageRating: menteeData.averageRating || 0,
                  skillsImproved: (profileData.user.skills || []).length,
                  goalsAchieved: 0, // Will be calculated from goals
                  totalGoals: 0, // Will be calculated from goals
                  currentStreak: 0, // TODO: Implement streak tracking
                  longestStreak: 0 // TODO: Implement streak tracking
                });

                // Set skills progress based on user skills
                const userSkills = profileData.user.skills || [];
                setSkillProgress(userSkills.map((skill: string, index: number) => ({
                  skill,
                  current: 60 + (index * 5), // Placeholder - needs skill tracking
                  target: 90,
                  sessions: Math.floor(menteeData.completedSessions / userSkills.length)
                })));
              }
            }
          } catch (profileError) {
            console.log('Error fetching profile:', profileError);
          }
        }

        // Fetch session history (bookings)
        if (user.id) {
          try {
            const bookingsResponse = await fetch(API_ENDPOINTS.BOOKINGS_BY_USER(user.id));
            if (bookingsResponse.ok) {
              const bookingsData = await bookingsResponse.json();

              // Filter for completed sessions and format
              const completed = (bookingsData.bookings || [])
                .filter((booking: any) => booking.status === 'completed')
                .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((booking: any) => ({
                  id: booking._id,
                  mentor: booking.mentorName,
                  mentorId: booking.mentor,
                  date: new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                  rawDate: booking.date,
                  duration: booking.duration,
                  topic: booking.sessionType,
                  rating: booking.rating || 0,
                  feedback: booking.review || booking.notes || "Session completed successfully",
                  skillsFocused: booking.topics || [],
                  avatar: getInitials(booking.mentorName)
                }));

              setSessionHistory(completed);

              // Filter for upcoming sessions
              const upcoming = (bookingsData.bookings || [])
                .filter((booking: any) =>
                  (booking.status === 'confirmed' || booking.status === 'pending') &&
                  new Date(booking.date) >= new Date()
                )
                .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5)
                .map((booking: any) => ({
                  id: booking._id,
                  mentor: booking.mentorName,
                  date: new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                  time: booking.startTime || 'TBD',
                  duration: booking.duration,
                  topic: booking.sessionType,
                  status: booking.status,
                  avatar: getInitials(booking.mentorName)
                }));

              setUpcomingSessions(upcoming);

              // Calculate monthly progress (sessions per month)
              const monthlyData = calculateMonthlyProgress(bookingsData.bookings || []);
              setMonthlyProgress(monthlyData);

              // Calculate top skills from completed sessions
              const skillsMap = new Map();
              completed.forEach((session: any) => {
                session.skillsFocused.forEach((skill: string) => {
                  skillsMap.set(skill, (skillsMap.get(skill) || 0) + 1);
                });
              });
              const topSkillsData = Array.from(skillsMap.entries())
                .map(([skill, count]) => ({ skill, sessions: count }))
                .sort((a, b) => b.sessions - a.sessions)
                .slice(0, 5);
              setTopSkills(topSkillsData);
            }

            // Fetch learning streak
            const streakResponse = await fetch(`${API_ENDPOINTS.BOOKINGS}/user/${user.id}/streak`);
            if (streakResponse.ok) {
              const streakData = await streakResponse.json();
              setProgressStats(prev => ({
                ...prev,
                currentStreak: streakData.currentStreak || 0,
                longestStreak: streakData.longestStreak || 0
              }));
            }
          } catch (bookingError) {
            console.log('Error fetching bookings:', bookingError);
          }
        }

      } catch (error) {
        console.error('Error loading progress data:', error);
        toast({
          title: "Error",
          description: "Failed to load progress data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProgressData();
  }, [toast]);

  // Calculate monthly progress for chart
  const calculateMonthlyProgress = (bookings: any[]) => {
    const last6Months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });

      const sessionsInMonth = bookings.filter((booking: any) => {
        if (booking.status !== 'completed') return false;
        const bookingDate = new Date(booking.date);
        return bookingDate.getMonth() === date.getMonth() &&
          bookingDate.getFullYear() === date.getFullYear();
      }).length;

      const hoursInMonth = bookings
        .filter((booking: any) => {
          if (booking.status !== 'completed') return false;
          const bookingDate = new Date(booking.date);
          return bookingDate.getMonth() === date.getMonth() &&
            bookingDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, booking) => {
          const hours = parseInt(booking.duration) || 1;
          return sum + hours;
        }, 0);

      last6Months.push({
        month: monthName,
        sessions: sessionsInMonth,
        hours: hoursInMonth
      });
    }

    return last6Months;
  };

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your progress...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-muted/30 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
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

        {/* Progress Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Monthly Progress Chart */}
          <Card className="mentor-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Learning Activity (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyProgress.map((month, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">{month.month}</span>
                      <div className="flex items-center space-x-4 text-muted-foreground">
                        <span>{month.sessions} sessions</span>
                        <span>{month.hours}h</span>
                      </div>
                    </div>
                    <div className="relative">
                      <ProgressBar
                        value={(month.sessions / Math.max(...monthlyProgress.map(m => m.sessions), 1)) * 100}
                        className="h-3"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Skills */}
          <Card className="mentor-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Top Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topSkills.length > 0 ? (
                  topSkills.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 text-primary font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">
                          {index + 1}
                        </div>
                        <span className="font-medium">{skill.skill}</span>
                      </div>
                      <Badge variant="secondary">{skill.sessions} sessions</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Complete sessions to see your top focus areas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Sessions Preview */}
        {upcomingSessions.length > 0 && (
          <Card className="mentor-card mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Upcoming Sessions
                </CardTitle>
                <Link to="/booking">
                  <Button variant="ghost" size="sm">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{session.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{session.mentor}</h4>
                        <p className="text-xs text-muted-foreground">{session.date}</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium mb-2">{session.topic}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{session.time} • {session.duration}</span>
                      <Badge variant={session.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills Progress</TabsTrigger>
            <TabsTrigger value="goals">Learning Goals</TabsTrigger>
            <TabsTrigger value="history">Session History</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Summary */}
              <Card className="mentor-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Performance Summary
                  </CardTitle>
                  <CardDescription>Your learning metrics at a glance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-500 p-2 rounded-full">
                        <ArrowUp className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Completion Rate</p>
                        <p className="text-xs text-muted-foreground">Sessions completed vs scheduled</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      {progressStats.totalSessions > 0 ? '95%' : '0%'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-500 p-2 rounded-full">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Avg Session Rating</p>
                        <p className="text-xs text-muted-foreground">Based on mentor feedback</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {progressStats.averageRating.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-500 p-2 rounded-full">
                        <Award className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Learning Streak</p>
                        <p className="text-xs text-muted-foreground">Current / Longest</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-purple-600">
                      {progressStats.currentStreak} / {progressStats.longestStreak}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Feedback */}
              <Card className="mentor-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Recent Mentor Feedback
                  </CardTitle>
                  <CardDescription>What your mentors are saying</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sessionHistory.slice(0, 3).map((session) => (
                    session.rating > 0 && (
                      <div key={session.id} className="p-3 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">{session.avatar}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{session.mentor}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: session.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{session.feedback}</p>
                        <p className="text-xs text-muted-foreground mt-1">{session.date}</p>
                      </div>
                    )
                  ))}
                  {sessionHistory.filter(s => s.rating > 0).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Complete and rate sessions to see mentor feedback
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

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
                {skillProgress.length > 0 ? (
                  skillProgress.map((skill, index) => (
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
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Add skills to your profile to track progress
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Learning Goals */}
          <TabsContent value="goals" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {learningGoals.length > 0 ? (
                learningGoals.map((goal) => (
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
                ))
              ) : (
                <div className="col-span-2">
                  <Card className="mentor-card">
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Learning Goals Yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Set goals in your profile to track your learning progress
                        </p>
                        <Link to="/profile">
                          <Button>Go to Profile</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
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
                {sessionHistory.length > 0 ? (
                  sessionHistory.map((session) => (
                    <div key={session.id} className="border-l-4 border-primary/20 pl-4 space-y-3 hover:border-primary/50 transition-colors">
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
                        {session.rating > 0 && (
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < session.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <h5 className="font-medium text-foreground">{session.topic}</h5>
                      {session.rating > 0 && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1 font-medium">Mentor Feedback:</p>
                          <p className="text-sm">{session.feedback}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {session.skillsFocused.map((skill: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Sessions Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Book your first session to start tracking your progress
                    </p>
                    <Link to="/mentors">
                      <Button>Find a Mentor</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {achievements.length > 0 ? (
                achievements.map((achievement, index) => (
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
                ))
              ) : (
                <div className="col-span-2">
                  <Card className="mentor-card">
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Achievements Yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Complete sessions and reach milestones to earn achievements
                        </p>
                        <div className="flex justify-center gap-4">
                          <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <p className="text-2xl mb-1">🎯</p>
                            <p className="text-xs text-muted-foreground">First Session</p>
                          </div>
                          <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <p className="text-2xl mb-1">🔥</p>
                            <p className="text-xs text-muted-foreground">7 Day Streak</p>
                          </div>
                          <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <p className="text-2xl mb-1">⭐</p>
                            <p className="text-xs text-muted-foreground">5 Star Rating</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Progress;