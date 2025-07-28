import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, FileText, CheckCircle, AlertTriangle } from "lucide-react";

interface PbnAttachmentDialogProps {
  liveGameId: number;
  children: React.ReactNode;
  onSuccess?: () => void;
}

interface AttachmentResult {
  success: boolean;
  message: string;
  mergedBoards?: number[];
  conflicts?: Array<{
    boardNumber: number;
    conflictType: 'bidding' | 'result' | 'vulnerability';
    liveData: any;
    pbnData: any;
  }>;
}

export default function PbnAttachmentDialog({ liveGameId, children, onSuccess }: PbnAttachmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const attachPbnMutation = useMutation({
    mutationFn: async (formData: FormData): Promise<AttachmentResult> => {
      const response = await fetch(`/api/live-games/${liveGameId}/attach-pbn`, {
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
      queryClient.invalidateQueries({ queryKey: [`/api/live-games/${liveGameId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/live-games/${liveGameId}/hands`] });
      queryClient.invalidateQueries({ queryKey: ["/api/live-games"] });
      
      toast({
        title: "PBN File Attached",
        description: result.message + (result.mergedBoards?.length ? ` (${result.mergedBoards.length} boards merged)` : ''),
      });

      // Show conflicts if any
      if (result.conflicts && result.conflicts.length > 0) {
        toast({
          title: "Data Conflicts Detected",
          description: `${result.conflicts.length} conflicts found. Live game data has been preserved where conflicts occurred.`,
          variant: "default",
        });
      }

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
        description: "Please select a PBN file to upload",
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
      <DialogContent className="max-w-md">
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
              The PBN file will be merged with your live game data. Your bidding sequences, notes, and opening leads will be preserved.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <div>
                    <p className="font-medium">Drop PBN file here</p>
                    <p className="text-sm text-gray-500">or click to browse</p>
                  </div>
                  <Input
                    type="file"
                    accept=".pbn,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                    id="pbn-file-input"
                  />
                  <Label htmlFor="pbn-file-input" className="cursor-pointer">
                    <Button variant="outline" asChild>
                      <span>Browse Files</span>
                    </Button>
                  </Label>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={attachPbnMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || attachPbnMutation.isPending}
            >
              {attachPbnMutation.isPending ? "Attaching..." : "Attach PBN"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}