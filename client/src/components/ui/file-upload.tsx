import { useState, useRef } from "react";
import { Button } from "./button";
import { Card, CardContent } from "./card";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export const FileUpload = ({ 
  onFileSelect, 
  accept = ".pbn", 
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = ""
}: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <Card className={className}>
      <CardContent 
        className={`p-6 text-center cursor-pointer border-2 border-dashed transition-colors ${
          isDragOver ? 'border-bridge-green bg-green-50' : 'border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <div className="space-y-2">
          <div className="text-2xl">📁</div>
          <p className="text-sm text-gray-600">
            Drop your PBN file here or click to browse
          </p>
          <Button variant="outline" type="button">
            Choose File
          </Button>
          <p className="text-xs text-gray-500">
            Supports {accept} files up to {maxSize / 1024 / 1024}MB
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};
