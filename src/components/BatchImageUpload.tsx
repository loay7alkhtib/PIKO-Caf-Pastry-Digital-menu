import React, { useCallback, useState } from 'react';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  AlertCircle,
  CheckCircle,
  Download,
  Upload,
  XCircle,
} from 'lucide-react';
import { imageUploadService } from '@/lib/imageUploadService';

interface UploadResult {
  fileName: string;
  success: boolean;
  url?: string;
  error?: string;
  matchedItem?: string;
  matchType?: 'exact' | 'partial' | 'fuzzy';
}

interface BatchUploadResult {
  success: boolean;
  uploaded: number;
  failed: number;
  results: UploadResult[];
}

interface BatchImageUploadProps {
  onUploadComplete?: (results: BatchUploadResult) => void;
  itemNames?: string[]; // Optional list of item names for matching
}

const BatchImageUpload: React.FC<BatchImageUploadProps> = ({
  onUploadComplete,
  itemNames = [],
}) => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<BatchUploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  const uploadImages = async () => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setResults(null);

    try {
      const fileArray = Array.from(files);
      const uploadResults = await imageUploadService.batchUploadWithMatching(
        fileArray,
        itemNames,
        'menu-items',
      );

      setResults(uploadResults);
      onUploadComplete?.(uploadResults);
    } catch (error) {
      console.error('Batch upload error:', error);
      setResults({
        success: false,
        uploaded: 0,
        failed: files.length,
        results: Array.from(files).map(file => ({
          fileName: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })),
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const downloadResults = () => {
    if (!results) return;

    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `upload-results-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getMatchTypeColor = (matchType?: string) => {
    switch (matchType) {
      case 'exact':
        return 'bg-green-500';
      case 'partial':
        return 'bg-yellow-500';
      case 'fuzzy':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Upload className='w-5 h-5' />
            Batch Image Upload
          </CardTitle>
          <CardDescription>
            Upload multiple images at once. Images will be automatically matched
            with menu items based on filename.
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
              id='batch-upload-input'
            />
            <Button
              type='button'
              variant='outline'
              onClick={() =>
                document.getElementById('batch-upload-input')?.click()
              }
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
                  Upload {files.length} Images
                </>
              )}
            </Button>
          )}

          {/* Progress Bar */}
          {isUploading && (
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>Upload Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className='w-full' />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              Upload Results
              <Button
                variant='outline'
                size='sm'
                onClick={downloadResults}
                className='ml-auto'
              >
                <Download className='w-4 h-4 mr-2' />
                Download Results
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {results.uploaded}
                </div>
                <div className='text-sm text-muted-foreground'>Uploaded</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-red-600'>
                  {results.failed}
                </div>
                <div className='text-sm text-muted-foreground'>Failed</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {results.results.filter(r => r.matchedItem).length}
                </div>
                <div className='text-sm text-muted-foreground'>Matched</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-orange-600'>
                  {
                    results.results.filter(r => !r.matchedItem && !r.success)
                      .length
                  }
                </div>
                <div className='text-sm text-muted-foreground'>Unmatched</div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className='space-y-2 max-h-60 overflow-y-auto'>
              {results.results.map((result, index) => (
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
                    {result.matchType && (
                      <Badge className={getMatchTypeColor(result.matchType)}>
                        {result.matchType}
                      </Badge>
                    )}
                    {result.url && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => window.open(result.url, '_blank')}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Warnings */}
            {results.results.some(r => !r.matchedItem && !r.success) && (
              <Alert className='mt-4'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  Some images couldn't be matched with menu items. Check the
                  unmatched files above.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BatchImageUpload;
