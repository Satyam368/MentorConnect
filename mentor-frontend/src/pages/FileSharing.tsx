import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Download, 
  Eye, 
  Share2, 
  Trash2, 
  Search,
  Filter,
  Calendar,
  User,
  Link2,
  Folder,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FileSharing = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Shared files data
  const [sharedFiles] = useState<any[]>([]);

  // Shared links data
  const [linkShares] = useState<any[]>([]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
      case "document":
        return <FileText className="h-8 w-8 text-red-500" />;
      case "image":
        return <Image className="h-8 w-8 text-green-500" />;
      case "design":
        return <File className="h-8 w-8 text-purple-500" />;
      case "archive":
        return <Folder className="h-8 w-8 text-yellow-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      toast({
        title: "Files uploaded successfully!",
        description: `${files.length} file(s) have been uploaded and shared.`,
      });
    }
  };

  const handleDownload = (fileName: string) => {
    toast({
      title: "Download started",
      description: `${fileName} is being downloaded.`,
    });
  };

  const handleShare = (fileName: string) => {
    navigator.clipboard.writeText(`https://mentorconnect.app/files/shared/${fileName}`);
    toast({
      title: "Link copied!",
      description: "Share link has been copied to clipboard.",
    });
  };

  const filteredFiles = sharedFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || file.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">File Sharing</h1>
            <p className="text-muted-foreground">Share and access learning materials, assignments, and resources</p>
          </div>
          <Button onClick={handleFileUpload} className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Upload Files</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="mentor-card">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-primary/10 p-3 rounded-full">
                  <File className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">{sharedFiles.length}</p>
                  <p className="text-muted-foreground text-sm">Total Files</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mentor-card">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-secondary/10 p-3 rounded-full">
                  <Download className="h-6 w-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">0</p>
                  <p className="text-muted-foreground text-sm">Downloads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mentor-card">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <Share2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">{linkShares.length}</p>
                  <p className="text-muted-foreground text-sm">Shared Links</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mentor-card">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Folder className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">0</p>
                  <p className="text-muted-foreground text-sm">MB Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mentor-card mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files, descriptions, or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">PDF Documents</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="design">Design Files</SelectItem>
                  <SelectItem value="archive">Archives</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date Uploaded</SelectItem>
                  <SelectItem value="name">File Name</SelectItem>
                  <SelectItem value="size">File Size</SelectItem>
                  <SelectItem value="downloads">Downloads</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shared Files */}
          <div>
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <File className="h-5 w-5 mr-2" />
                  Shared Files ({filteredFiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredFiles.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground truncate">{file.name}</h4>
                          <div className="flex items-center space-x-1">
                            {file.isPrivate && (
                              <Badge variant="secondary" className="text-xs">Private</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">{file.category}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{file.description}</p>
                        
                        <div className="flex items-center space-x-2 mb-3">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className="text-xs">{file.avatar}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">{file.uploadedBy}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{file.uploadedAt}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{file.size}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Download className="h-3 w-3 mr-1" />
                              {file.downloads}
                            </span>
                            <span>Shared with: {file.sharedWith}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(file.name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShare(file.name)}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredFiles.length === 0 && (
                  <div className="text-center py-8">
                    <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No files found matching your criteria</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Shared Links */}
          <div>
            <Card className="mentor-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Link2 className="h-5 w-5 mr-2" />
                    Shared Links ({linkShares.length})
                  </span>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Link
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {linkShares.map((link) => (
                  <div key={link.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground">{link.title}</h4>
                        <Badge variant="outline" className="text-xs">{link.category}</Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                      
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-xs">{link.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{link.sharedBy}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{link.sharedAt}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Eye className="h-3 w-3 mr-1" />
                          <span>{link.clicks} clicks</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button variant="outline" size="sm" asChild>
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                              Open Link
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(link.title)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Upload */}
            <Card className="mentor-card mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Quick Share
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="shareTitle">Title</Label>
                  <Input id="shareTitle" placeholder="Enter resource title" />
                </div>
                <div>
                  <Label htmlFor="shareUrl">URL</Label>
                  <Input id="shareUrl" placeholder="https://example.com" />
                </div>
                <div>
                  <Label htmlFor="shareDescription">Description</Label>
                  <Textarea 
                    id="shareDescription" 
                    placeholder="Brief description of the resource"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">Course</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="repository">Repository</SelectItem>
                      <SelectItem value="tool">Tool</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">
                  <Link2 className="h-4 w-4 mr-2" />
                  Share Link
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileSharing;