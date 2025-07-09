import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, CheckCircle, AlertCircle, Link, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

interface PBNUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PBNUpload({ open, onOpenChange }: PBNUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pbnUrl, setPbnUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user?.id || 'current-user');

      // Simulate progress
      setUploadProgress(25);
      
      const response = await fetch('/api/games/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(75);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      setUploadProgress(100);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Successfully uploaded ${data.hands.length} hands from ${data.game.title}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      // Redirect to the game page for immediate editing
      setLocation(`/games/${data.game.id}?edit=true`);
      // Close dialog after redirect
      setTimeout(() => handleClose(), 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const importUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      setUploadProgress(25);
      
      const response = await apiRequest("POST", "/api/games/import-url", { url });
      
      setUploadProgress(75);
      const data = await response.json();
      
      setUploadProgress(100);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.hands.length} hands from ${data.game.title}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      // Redirect to the game page for immediate editing
      setLocation(`/games/${data.game.id}?edit=true`);
      // Close dialog after redirect
      setTimeout(() => handleClose(), 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pbn')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a PBN file (.pbn extension)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleUrlImport = () => {
    if (pbnUrl.trim()) {
      importUrlMutation.mutate(pbnUrl.trim());
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPbnUrl("");
    setUploadProgress(0);
    setDragActive(false);
    setActiveTab("file");
    onOpenChange(false);
  };

  const isUploading = uploadMutation.isPending;
  const isImporting = importUrlMutation.isPending;
  const isProcessing = isUploading || isImporting;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Import PBN File</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "file" | "url")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Upload File</span>
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>Import URL</span>
            </TabsTrigger>
          </TabsList>

          <div className="space-y-6 mt-6">
            <TabsContent value="file" className="space-y-6">
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-4">
                    <FileText className="h-12 w-12 mx-auto text-primary" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-text-secondary">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {!isProcessing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <p className="text-lg font-medium">Drop your PBN file here</p>
                      <p className="text-sm text-text-secondary">
                        or click to browse files
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse Files
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pbn"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Upload Info */}
              <div className="text-xs text-text-secondary space-y-1">
                <p>• PBN files should contain bridge game data with hands and bidding</p>
                <p>• Maximum file size: 10MB</p>
                <p>• Supported format: Portable Bridge Notation (.pbn)</p>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-6">
              {/* URL Input */}
              <div className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Link className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium mb-2">Import from URL</p>
                  <p className="text-sm text-text-secondary mb-4">
                    Enter a direct link to a PBN file
                  </p>
                  <div className="max-w-md mx-auto">
                    <Label htmlFor="pbn-url" className="text-sm font-medium">
                      PBN File URL
                    </Label>
                    <Input
                      id="pbn-url"
                      type="url"
                      placeholder="https://example.com/game.pbn"
                      value={pbnUrl}
                      onChange={(e) => setPbnUrl(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* URL Import Info */}
              <div className="text-xs text-text-secondary space-y-1">
                <p>• URL must be a direct link to a PBN file</p>
                <p>• Only HTTP and HTTPS URLs are supported</p>
                <p>• File must be accessible without authentication</p>
                <p>• Some club websites block automated access - use file upload instead</p>
              </div>
            </TabsContent>

            {/* Progress and Status */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>
                    {isUploading ? "Upload" : "Import"} Progress
                  </Label>
                  <span className="text-sm text-text-secondary">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Success/Error Messages */}
            {(uploadMutation.isSuccess || importUrlMutation.isSuccess) && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  PBN file {activeTab === "file" ? "uploaded" : "imported"} successfully! The games are now available in your dashboard.
                </AlertDescription>
              </Alert>
            )}

            {(uploadMutation.isError || importUrlMutation.isError) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {uploadMutation.error?.message || importUrlMutation.error?.message || `Failed to ${activeTab === "file" ? "upload" : "import"} PBN file`}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Cancel
              </Button>
              {activeTab === "file" ? (
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isProcessing}
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              ) : (
                <Button
                  onClick={handleUrlImport}
                  disabled={!pbnUrl.trim() || isProcessing}
                >
                  {isImporting ? "Importing..." : "Import"}
                </Button>
              )}
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
