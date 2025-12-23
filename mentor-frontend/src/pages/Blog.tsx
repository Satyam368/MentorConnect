import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, Heart, MessageCircle, BookOpen, PenTool, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { blogService, BlogPost } from "@/services/blogService";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

const Blog = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBlogPosts = async () => {
    try {
      setIsLoading(true);
      const data = await blogService.getAllBlogs({
        page,
        limit: 10,
        category: selectedCategory,
        search: searchTerm
      });
      setBlogPosts(data.blogs);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogPosts();
  }, [page, selectedCategory]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchBlogPosts();
      else setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const categories = ["all", "React", "Node.js", "UX Design", "Career", "System Design", "Data Science"];

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setPage(1);
  };



  const handleWritePost = () => {
    try {
      const authUserStr = localStorage.getItem("authUser");
      const authUser = authUserStr ? JSON.parse(authUserStr) : null;
      console.log("Write Post Clicked - Auth User:", authUser); // Debugging

      if (authUser && (authUser.id || authUser._id || authUser.email)) {
        navigate("/blog-editor");
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/login");
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 min-h-screen relative overflow-hidden pt-24">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Mentor <span className="text-gradient">Blog</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Insights, tutorials, and career advice from our community of expert mentors.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              className="btn-premium bg-primary text-primary-foreground shadow-lg hover:shadow-primary/25"
              onClick={handleWritePost}
            >
              <PenTool className="mr-2 h-4 w-4" />
              Write a Post
            </Button>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <div className="glass-panel p-6 rounded-2xl shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search articles, topics, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-700/30 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full md:w-48 h-11 bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-700/30">
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
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && blogPosts.length === 0 ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading inspiring content...</p>
          </div>
        ) : (
          <>
            {/* Posts Grid */}
            {blogPosts.length > 0 ? (
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {blogPosts.map((post) => (
                  <motion.div key={post._id} variants={item}>
                    <Card className="glass-card border-0 h-full flex flex-col overflow-hidden group hover:shadow-2xl transition-all duration-300">
                      {post.coverImage && (
                        <div className="aspect-video w-full overflow-hidden relative">
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10" />
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                          />
                          <Badge className="absolute top-4 left-4 z-20 bg-white/90 text-foreground dark:bg-slate-900/90 backdrop-blur-sm">
                            {post.category}
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                          </span>
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {post.views}
                            </span>
                            <span className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              {post.likes.length}
                            </span>
                          </div>
                        </div>
                        <CardTitle className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                          <Link to={`/blog/${post._id}`}>
                            {post.title}
                          </Link>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col pt-0">
                        <p className="text-muted-foreground text-sm mb-6 line-clamp-3 flex-1 leading-relaxed">
                          {post.excerpt}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8 border border-border">
                              <AvatarImage src={post.author.profilePicture} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {post.author.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{post.author.name}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 p-0 hover:bg-transparent group/btn" asChild>
                            <Link to={`/blog/${post._id}`} className="flex items-center">
                              Read More
                              <ArrowRight className="ml-1 h-3 w-3 transform group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="bg-muted/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No blog posts found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We couldn't find any articles matching your search. Try adjusting your filters or search terms.
                </p>
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="hover:bg-primary/5"
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm font-medium text-muted-foreground bg-white/50 dark:bg-slate-900/50 rounded-md border border-border/50">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="hover:bg-primary/5"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Blog;