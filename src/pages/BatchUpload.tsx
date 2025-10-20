import React, { useRef, useState } from 'react';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Upload,
  XCircle,
} from 'lucide-react';

interface UploadResult {
  fileName: string;
  success: boolean;
  url?: string;
  error?: string;
  matchedItem?: string;
}

interface BatchUploadProps {
  onNavigate: (page: string) => void;
}

const BatchUpload: React.FC<BatchUploadProps> = ({ onNavigate }) => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supabase Configuration
  const SUPABASE_URL = 'https://eoaissoqwlfvfizfomax.supabase.co';
  const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvYWlzc29xd2xmdmZpemZvbWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTY5OTIsImV4cCI6MjA3NTMzMjk5Mn0.SHkFV9EvSnWVmC0tApVU6A6C1rrDqsPMO922rMC1JpY';
  const BUCKET_NAME = 'menu-images';

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  const uploadFileToSupabase = async (
    file: File,
    index: number,
    total: number,
  ): Promise<UploadResult> => {
    try {
      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const baseName = file.name.replace(/\.[^/.]+$/, '');

      // Sanitize filename for Supabase Storage (no Arabic, spaces, or special chars)
      const sanitizeFileName = (name: string) => {
        return name
          .replace(/[\u0600-\u06FF]/g, '') // Remove Arabic characters
          .replace(/[^a-zA-Z0-9.-]/g, '-') // Replace special chars with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
          .toLowerCase();
      };

      const safeBaseName = sanitizeFileName(baseName);
      const uniqueFileName = `${safeBaseName || 'image'}-${timestamp}.${fileExtension}`;
      const filePath = `menu-items/${uniqueFileName}`;

      console.log(
        `🔄 Uploading ${index + 1}/${total}: ${file.name} → ${filePath}`,
      );

      // Create FormData
      const formData = new FormData();
      formData.append('file', file, uniqueFileName);

      // Upload to Supabase Storage
      const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: formData,
        },
      );

      if (response.ok) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
        console.log(`✅ Uploaded: ${file.name} → ${publicUrl}`);

        return {
          fileName: file.name,
          success: true,
          url: publicUrl,
          matchedItem: baseName, // Simple matching for now
        };
      } else {
        const errorText = await response.text();
        console.error(
          `❌ Upload failed for ${file.name}:`,
          response.status,
          errorText
        );

        return {
          fileName: file.name,
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }
    } catch (error) {
      console.error(`❌ Upload error for ${file.name}:`, error);
      return {
        fileName: file.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const uploadImages = async () => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setResults([]);

    const uploadResults: UploadResult[] = [];
    const totalFiles = files.length;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const result = await uploadFileToSupabase(file, i, totalFiles);
        uploadResults.push(result);

        // Update progress
        const progress = ((i + 1) / totalFiles) * 100;
        setUploadProgress(progress);

        // Small delay to avoid overwhelming the server
        if (i < totalFiles - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setResults(uploadResults);
    } catch (error) {
      console.error('Upload process error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const successfulUploads = results.filter(r => r.success).length;
  const failedUploads = results.filter(r => !r.success).length;

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <Button
            variant='outline'
            onClick={() => onNavigate('admin')}
            className='mb-4'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Admin
          </Button>
          <h1 className='text-3xl font-bold'>📸 Batch Image Upload</h1>
          <p className='text-muted-foreground mt-2'>
            Upload multiple images at once to Supabase Storage
          </p>
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Upload className='w-5 h-5' />
                Upload Images
              </CardTitle>
              <CardDescription>
                Drag and drop your images or click to browse. Images will be
                uploaded directly to Supabase Storage.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* File Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className='w-12 h-12 mx-auto mb-4 text-muted-foreground' />
                <h3 className='text-lg font-semibold mb-2'>
                  {files
                    ? `${files.length} files selected`
                    : 'Drop images here or click to browse'}
                </h3>
                <p className='text-sm text-muted-foreground mb-4'>
                  Supports JPG, PNG, WebP, GIF (max 5MB each)
                </p>

                <input
                  type='file'
                  multiple
                  accept='image/*'
                  onChange={handleFileSelect}
                  className='hidden'
                  ref={fileInputRef}
                />
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select Images
                </Button>
              </div>

              {/* File List */}
              {files && files.length > 0 && (
                <div className='space-y-2'>
                  <h4 className='font-medium'>Selected Files:</h4>
                  <div className='max-h-40 overflow-y-auto space-y-1'>
                    {Array.from(files).map((file, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between p-2 bg-muted rounded'
                      >
                        <span className='text-sm'>{file.name}</span>
                        <span className='text-xs text-muted-foreground'>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {files && files.length > 0 && (
                <Button
                  onClick={uploadImages}
                  disabled={isUploading}
                  className='w-full'
                >
                  {isUploading ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className='w-4 h-4 mr-2' />
                      Upload {files.length} Images to Supabase
                    </>
                  )}
                </Button>
              )}

              {/* Progress Bar */}
              {isUploading && (
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>Upload Progress</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className='w-full' />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Results</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Summary */}
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-green-600'>
                      {successfulUploads}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Successful
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-red-600'>
                      {failedUploads}
                    </div>
                    <div className='text-sm text-muted-foreground'>Failed</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-blue-600'>
                      {results.length}
                    </div>
                    <div className='text-sm text-muted-foreground'>Total</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-purple-600'>
                      {Math.round((successfulUploads / results.length) * 100)}%
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Success Rate
                    </div>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className='space-y-2 max-h-60 overflow-y-auto'>
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-3 border rounded'
                    >
                      <div className='flex items-center gap-3'>
                        {result.success ? (
                          <CheckCircle className='w-5 h-5 text-green-500' />
                        ) : (
                          <XCircle className='w-5 h-5 text-red-500' />
                        )}
                        <div>
                          <div className='font-medium'>{result.fileName}</div>
                          {result.matchedItem && (
                            <div className='text-sm text-muted-foreground'>
                              Matched: {result.matchedItem}
                            </div>
                          )}
                          {result.error && (
                            <div className='text-sm text-red-600'>
                              {result.error}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        {result.success && result.url && (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => window.open(result.url, '_blank')}
                          >
                            <ExternalLink className='w-4 h-4 mr-1' />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Warnings */}
                {failedUploads > 0 && (
                  <Alert className='mt-4'>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>
                      {failedUploads} upload(s) failed. Check the error messages
                      above for details.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchUpload;
