import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Calendar, Eye, Heart, MessageCircle, ArrowLeft, Share2, Clock } from "lucide-react";
import { blogService, BlogPost } from "@/services/blogService";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const BlogDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [comment, setComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("authUser") || localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        const fetchPost = async () => {
            if (!id) return;
            try {
                setIsLoading(true);
                const data = await blogService.getBlogById(id);
                setPost(data);

                // Check if current user has liked the post
                if (user && data.likes.includes(user.id || user._id)) {
                    setIsLiked(true);
                }
            } catch (error) {
                console.error("Error fetching blog post:", error);
                toast({
                    title: "Error",
                    description: "Failed to load blog post",
                    variant: "destructive"
                });
                navigate("/blog");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [id, user, navigate, toast]);

    const handleLike = async () => {
        if (!user) {
            toast({
                title: "Authentication required",
                description: "Please log in to like this post",
                variant: "destructive"
            });
            return;
        }

        if (!post || !id) return;

        try {
            // Optimistic update
            setIsLiked(!isLiked);
            setPost(prev => prev ? {
                ...prev,
                likes: isLiked
                    ? prev.likes.filter(uid => uid !== (user.id || user._id))
                    : [...prev.likes, (user.id || user._id)]
            } : null);

            await blogService.likeBlog(id, user.id || user._id);
        } catch (error) {
            console.error("Error liking post:", error);
            // Revert on error
            setIsLiked(!isLiked);
        }
    };

    const handleCommentSubmit = async () => {
        if (!user) {
            toast({
                title: "Authentication required",
                description: "Please log in to comment",
                variant: "destructive"
            });
            return;
        }

        if (!comment.trim() || !id) return;

        try {
            setIsSubmittingComment(true);
            const newComments = await blogService.addComment(id, comment, user.id || user._id);

            setPost(prev => prev ? { ...prev, comments: newComments } : null);
            setComment("");
            toast({ title: "Comment added" });
        } catch (error) {
            console.error("Error adding comment:", error);
            toast({
                title: "Error",
                description: "Failed to add comment",
                variant: "destructive"
            });
        } finally {
            setIsSubmittingComment(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="flex-1 bg-muted/30 pt-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 transition-all" onClick={() => navigate("/blog")}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
                </Button>

                <article className="space-y-8">
                    {/* Header */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">{post.category}</Badge>
                            <span className="text-sm text-muted-foreground">
                                {format(new Date(post.publishedAt), "MMMM d, yyyy")}
                            </span>
                        </div>

                        <h1 className="text-4xl font-bold text-foreground leading-tight">{post.title}</h1>

                        <div className="flex items-center justify-between py-4 border-b">
                            <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={post.author.profilePicture} />
                                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm">{post.author.name}</p>
                                    <p className="text-xs text-muted-foreground">{post.author.role === 'mentor' ? 'Mentor' : 'Student'}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 text-muted-foreground text-sm">
                                <span className="flex items-center">
                                    <Eye className="h-4 w-4 mr-1" /> {post.views}
                                </span>
                                <span className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" /> {Math.ceil(post.content.length / 1000)} min read
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Cover Image */}
                    {post.coverImage && (
                        <div className="rounded-xl overflow-hidden shadow-sm aspect-video w-full">
                            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Content */}
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <div className="whitespace-pre-wrap leading-relaxed text-lg text-foreground/90">
                            {post.content}
                        </div>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-4">
                            {post.tags.map(tag => (
                                <Badge key={tag} variant="outline">#{tag}</Badge>
                            ))}
                        </div>
                    )}

                    <Separator className="my-8" />

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant={isLiked ? "default" : "outline"}
                                size="sm"
                                onClick={handleLike}
                                className={isLiked ? "bg-red-500 hover:bg-red-600 text-white border-red-500" : ""}
                            >
                                <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                                {post.likes.length} Likes
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}>
                                <MessageCircle className="h-4 w-4 mr-2" />
                                {post.comments.length} Comments
                            </Button>
                        </div>
                        <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4 mr-2" /> Share
                        </Button>
                    </div>

                    {/* Comments Section */}
                    <div id="comments" className="pt-8 space-y-6">
                        <h3 className="text-2xl font-bold">Comments ({post.comments.length})</h3>

                        {/* Add Comment */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex gap-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{user ? user.name.charAt(0) : "?"}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-2">
                                        <Textarea
                                            placeholder="Share your thoughts..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            rows={3}
                                        />
                                        <div className="flex justify-end">
                                            <Button onClick={handleCommentSubmit} disabled={!comment.trim() || isSubmittingComment}>
                                                {isSubmittingComment ? "Posting..." : "Post Comment"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Comments List */}
                        <div className="space-y-4">
                            {post.comments.map((comment) => (
                                <Card key={comment._id} className="bg-muted/20 border-none">
                                    <CardContent className="pt-4">
                                        <div className="flex gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={comment.user.profilePicture} />
                                                <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-sm">{comment.user.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-foreground/90">{comment.content}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default BlogDetail;
