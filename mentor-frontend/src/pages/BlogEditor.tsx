import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Tags, Layout, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { blogService } from "@/services/blogService";

const BlogEditor = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("React");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("authUser") || localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      toast({
        title: "Authentication required",
        description: "Please log in to write a blog post",
        variant: "destructive"
      });
      navigate("/login");
    }
  }, [navigate, toast]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => setTags(tags.filter(x => x !== t));

  const handlePublish = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      await blogService.createBlog({
        title,
        content,
        excerpt,
        category,
        tags,
        authorId: user.id || user._id // Handle both id formats
      });

      toast({ title: "Post published!", description: "Your article is now live." });
      navigate("/blog");
    } catch (error) {
      console.error("Error publishing blog:", error);
      toast({
        title: "Error",
        description: "Failed to publish blog post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-muted/30 pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
            <FileText className="h-7 w-7 mr-2 text-primary" /> Write a Blog Post
          </h1>
          <p className="text-muted-foreground">Share your knowledge with the community</p>
        </div>

        <Card className="mentor-card">
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
            <CardDescription>Title, category, summary, content, and tags</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter a compelling title" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="React">React</SelectItem>
                    <SelectItem value="Node.js">Node.js</SelectItem>
                    <SelectItem value="UX Design">UX Design</SelectItem>
                    <SelectItem value="Career">Career</SelectItem>
                    <SelectItem value="System Design">System Design</SelectItem>
                    <SelectItem value="Data Science">Data Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Excerpt</label>
                <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary shown on cards" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center"><Layout className="h-4 w-4 mr-2" /> Content</label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} placeholder="Write your article here..." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center"><Tags className="h-4 w-4 mr-2" /> Tags</label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Press Enter to add" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
                <Button variant="outline" onClick={addTag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => removeTag(t)}>{t} ×</Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => toast({ title: "Draft saved" })}>
                <Save className="h-4 w-4 mr-2" /> Save Draft
              </Button>
              <Button onClick={handlePublish} disabled={!title || !content || isSubmitting}>
                {isSubmitting ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlogEditor;
