import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { Game, User } from "@shared/schema";

interface PBNUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PBNUpload({ open, onOpenChange }: PBNUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duplicateGame, setDuplicateGame] = useState<Game | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();



  const uploadMutation = useMutation({
    mutationFn: async ({ file, partners }: { file: File; partners: string[] }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user?.id || 'current-user');
      if (partners.length > 0) {
        formData.append('partners', JSON.stringify(partners));
      }

      // Simulate progress
      setUploadProgress(25);
      
      const response = await fetch('/api/games/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(75);

      if (response.status === 409) {
        // Handle duplicate game
        const errorData = await response.json();
        setDuplicateGame(errorData.duplicateGame);
        setShowDuplicateDialog(true);
        setUploadProgress(0);
        return null; // Don't proceed with success
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      setUploadProgress(100);
      return response.json();
    },
    onSuccess: (data) => {
      if (!data) return; // Skip success handling for duplicates
      
      toast({
        title: "Upload Successful",
        description: `Successfully uploaded ${data.hands.length} hands from ${data.game.title}`,
      });
      // Use targeted cache updates instead of broad invalidation
      queryClient.setQueryData(["/api/games"], (oldData: any) => 
        oldData ? [data.game, ...oldData.filter((g: any) => g.id !== data.game.id)] : [data.game]
      );
      queryClient.setQueryData([`/api/games/${data.game.id}`], data.game);
      handleClose();
      // Redirect to the game page and force edit mode
      setLocation(`/games/${data.game.id}?edit=true&new=true`);
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

  const forceUploadMutation = useMutation({
    mutationFn: async ({ file, partners }: { file: File; partners: string[] }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user?.id || 'current-user');
      formData.append('force', 'true'); // Add force flag
      if (partners.length > 0) {
        formData.append('partners', JSON.stringify(partners));
      }

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
      // Use targeted cache updates instead of broad invalidation
      queryClient.setQueryData(["/api/games"], (oldData: any) => 
        oldData ? [data.game, ...oldData.filter((g: any) => g.id !== data.game.id)] : [data.game]
      );
      queryClient.setQueryData([`/api/games/${data.game.id}`], data.game);
      handleClose();
      setLocation(`/games/${data.game.id}?edit=true&new=true`);
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
    const fileName = file.name.toLowerCase();
    const isValidExtension = fileName.endsWith('.pbn') || fileName.endsWith('.txt');
    const isValidType = file.type === 'text/plain' || file.type === '' || file.type === 'application/octet-stream';
    
    // More flexible validation for mobile devices (iPad)
    if (!isValidExtension && !isValidType) {
      toast({
        title: "Invalid File Type",
        description: "Please select a PBN file (.pbn or .txt extension)",
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
      uploadMutation.mutate({ file: selectedFile, partners: [] });
    }
  };



  const handleClose = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setDragActive(false);
    setDuplicateGame(null);
    setShowDuplicateDialog(false);
    onOpenChange(false);
  };

  const handleDuplicateConfirm = () => {
    if (selectedFile) {
      setShowDuplicateDialog(false);
      forceUploadMutation.mutate({ file: selectedFile, partners: [] });
    }
  };

  const handleViewExisting = () => {
    if (duplicateGame) {
      setLocation(`/games/${duplicateGame.id}`);
      handleClose();
    }
  };

  const isUploading = uploadMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload PBN File</span>
            </DialogTitle>
          </DialogHeader>

        <div className="space-y-6">
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
                {!isUploading && (
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
                  accept=".pbn,text/plain,*/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Upload Progress</span>
                <span className="text-sm text-text-secondary">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Upload Success/Error */}
          {uploadMutation.isSuccess && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                PBN file uploaded successfully! The games are now available in your dashboard.
              </AlertDescription>
            </Alert>
          )}

          {uploadMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {uploadMutation.error?.message || "Failed to upload PBN file"}
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Info */}
          <div className="text-xs text-text-secondary space-y-1">
            <p>• PBN files should contain bridge game data with hands and bidding</p>
            <p>• Maximum file size: 10MB</p>
            <p>• Supported formats: .pbn or .txt files containing PBN data</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Duplicate Game Dialog */}
    {duplicateGame && (
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Duplicate Game Detected</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                A game with the same first hand already exists in the system. 
                This might be the same game uploaded with a different filename.
              </AlertDescription>
            </Alert>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Existing Game:</h4>
              <p className="text-sm"><strong>Title:</strong> {duplicateGame.title}</p>
              {duplicateGame.tournament && (
                <p className="text-sm"><strong>Tournament:</strong> {duplicateGame.tournament}</p>
              )}
              {duplicateGame.date && (
                <p className="text-sm"><strong>Date:</strong> {duplicateGame.date}</p>
              )}
              {duplicateGame.filename && (
                <p className="text-sm"><strong>Filename:</strong> {duplicateGame.filename}</p>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleViewExisting}
              className="w-full sm:w-auto"
            >
              View Existing Game
            </Button>
            <Button 
              onClick={handleDuplicateConfirm}
              disabled={forceUploadMutation.isPending}
              className="w-full sm:w-auto"
            >
              {forceUploadMutation.isPending ? "Uploading..." : "Upload Anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}


    </>
  );
}
