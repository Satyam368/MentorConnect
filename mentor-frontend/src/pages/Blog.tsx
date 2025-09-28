import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, Eye, Heart, MessageCircle, Share2, BookOpen, TrendingUp, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  // Mock blog posts data
  const blogPosts = [
    {
      id: 1,
      title: "10 Essential React Patterns Every Developer Should Know",
      excerpt: "Discover the most important React patterns that will make your code more maintainable and efficient. From render props to custom hooks...",
      content: "Full blog content here...",
      author: "Dr. Sarah Johnson",
      authorAvatar: "👩‍💻",
      authorBio: "Senior Software Engineer",
      category: "React",
      tags: ["React", "JavaScript", "Patterns", "Best Practices"],
      publishedAt: "Dec 22, 2024",
      readTime: "8 min read",
      views: 1250,
      likes: 89,
      comments: 23,
      featured: true,
      coverImage: "/placeholder-blog-1.jpg"
    },
    {
      id: 2,
      title: "Building Scalable Node.js Applications: A Complete Guide",
      excerpt: "Learn how to architect Node.js applications that can handle millions of users. We'll cover everything from database optimization to...",
      content: "Full blog content here...",
      author: "Marcus Chen",
      authorAvatar: "👨‍🔬",
      authorBio: "Backend Architect",
      category: "Node.js",
      tags: ["Node.js", "Scalability", "Backend", "Architecture"],
      publishedAt: "Dec 20, 2024",
      readTime: "12 min read",
      views: 980,
      likes: 67,
      comments: 18,
      featured: false,
      coverImage: "/placeholder-blog-2.jpg"
    },
    {
      id: 3,
      title: "UX Design Principles That Actually Matter in 2024",
      excerpt: "The design landscape is constantly evolving. Here are the UX principles that are making a real difference in user satisfaction...",
      content: "Full blog content here...",
      author: "Elena Rodriguez",
      authorAvatar: "👩‍🎨",
      authorBio: "UX Design Lead",
      category: "UX Design",
      tags: ["UX", "Design", "User Experience", "Trends"],
      publishedAt: "Dec 18, 2024",
      readTime: "6 min read",
      views: 756,
      likes: 45,
      comments: 12,
      featured: true,
      coverImage: "/placeholder-blog-3.jpg"
    },
    {
      id: 4,
      title: "From Junior to Senior: My 5-Year Development Journey",
      excerpt: "A personal story about growing from a junior developer to a senior engineer. Lessons learned, mistakes made, and advice for others...",
      content: "Full blog content here...",
      author: "Alex Thompson",
      authorAvatar: "👨‍💻",
      authorBio: "Senior Full-Stack Developer",
      category: "Career",
      tags: ["Career", "Growth", "Development", "Personal Story"],
      publishedAt: "Dec 15, 2024",
      readTime: "10 min read",
      views: 2100,
      likes: 156,
      comments: 34,
      featured: false,
      coverImage: "/placeholder-blog-4.jpg"
    }
  ];

  const categories = ["all", "React", "Node.js", "UX Design", "Career", "System Design", "Data Science"];

  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  const filteredPosts = [...featuredPosts, ...regularPosts].filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Mentor Blog</h1>
          <p className="text-muted-foreground">Learn from experienced mentors through their insights and knowledge sharing</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <Card className="mentor-card">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search articles, topics, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "All Categories" : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="trending">Trending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2" />
              Featured Articles
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredPosts.slice(0, 2).map((post) => (
                <Card key={post.id} className="mentor-card overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted/50 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="default">{post.category}</Badge>
                      <Badge variant="outline" className="text-xs">Featured</Badge>
                    </div>
                    <CardTitle className="line-clamp-2 hover:text-primary cursor-pointer">
                      <Link to={`/blog/${post.id}`}>{post.title}</Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-sm">{post.authorAvatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{post.author}</p>
                          <p className="text-xs text-muted-foreground">{post.authorBio}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {post.publishedAt}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {post.readTime}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {post.views}
                        </span>
                        <span className="flex items-center">
                          <Heart className="h-3 w-3 mr-1" />
                          {post.likes}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/blog/${post.id}`}>Read Article</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Posts */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center">
            <BookOpen className="h-6 w-6 mr-2" />
            All Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="mentor-card hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{post.category}</Badge>
                    {post.featured && <Badge variant="outline" className="text-xs">Featured</Badge>}
                  </div>
                  <CardTitle className="text-lg line-clamp-2 hover:text-primary cursor-pointer">
                    <Link to={`/blog/${post.id}`}>{post.title}</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                  
                  <div className="flex items-center space-x-2 mb-4">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">{post.authorAvatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{post.author}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>{post.publishedAt}</span>
                    <span>{post.readTime}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {post.views}
                      </span>
                      <span className="flex items-center">
                        <Heart className="h-3 w-3 mr-1" />
                        {post.likes}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {post.comments}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Share2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to={`/blog/${post.id}`}>Read More</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* No Results */}
        {filteredPosts.length === 0 && (
          <Card className="mentor-card">
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No articles found</h3>
              <p className="text-muted-foreground">Try adjusting your search terms or filters</p>
            </CardContent>
          </Card>
        )}

        {/* Load More */}
        {filteredPosts.length > 6 && (
          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              Load More Articles
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;