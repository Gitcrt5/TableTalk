import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Upload, FileText, CheckCircle, AlertTriangle } from "lucide-react";

interface RegularGamePbnAttachmentProps {
  gameId: number;
  children: React.ReactNode;
  onSuccess?: () => void;
}

interface AttachmentResult {
  success: boolean;
  message: string;
}

export default function RegularGamePbnAttachment({ gameId, children, onSuccess }: RegularGamePbnAttachmentProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const attachPbnMutation = useMutation({
    mutationFn: async (formData: FormData): Promise<AttachmentResult> => {
      const response = await fetch(`/api/games/${gameId}/attach-pbn`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to attach PBN file');
      }
      
      return response.json();
    },
    onSuccess: (result: AttachmentResult) => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/hands`] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      
      toast({
        title: "PBN File Attached",
        description: result.message,
      });

      setOpen(false);
      setSelectedFile(null);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to attach PBN file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pbn') && !file.name.toLowerCase().endsWith('.txt')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a PBN file (.pbn or .txt extension)",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a PBN file to attach.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    attachPbnMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Attach PBN File
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will attach a PBN file to this game that originated from a live session. 
              The PBN file will replace the existing game data.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label>PBN File</Label>
              <div 
                className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {selectedFile ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {selectedFile.name}
                    </span>
                  ) : (
                    <>Drop a PBN file here, or click to browse</>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports .pbn and .txt files
                </p>
              </div>
              <Input
                id="file-upload"
                type="file"
                accept=".pbn,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedFile || attachPbnMutation.isPending}
            >
              {attachPbnMutation.isPending ? (
                "Attaching..."
              ) : (
                "Attach PBN"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}