import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { imageUploadService } from '@/lib/imageUploadService';

const UploadTest: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testUpload = async () => {
    setUploading(true);
    setResult('');

    try {
      // Create a simple test file
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText('TEST', 30, 50);
      }

      canvas.toBlob(async blob => {
        if (blob) {
          const file = new File([blob], 'test-image.png', {
            type: 'image/png',
          });

          console.log('🧪 Testing upload with file:', file);

          const uploadResult = await imageUploadService.uploadImage(
            file,
            'test-upload.png',
            'test-folder'
          );

          console.log('🧪 Upload result:', uploadResult);

          if (uploadResult.success) {
            setResult(`✅ Success! URL: ${uploadResult.url}`);
          } else {
            setResult(`❌ Failed: ${uploadResult.error}`);
          }
        }
        setUploading(false);
      }, 'image/png');
    } catch (error) {
      console.error('🧪 Test error:', error);
      setResult(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      setUploading(false);
    }
  };

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader>
        <CardTitle>🧪 Upload Test</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Button onClick={testUpload} disabled={uploading} className='w-full'>
          {uploading ? 'Testing...' : 'Test Upload'}
        </Button>

        {result && (
          <div
            className={`p-3 rounded text-sm ${
              result.includes('✅')
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {result}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UploadTest;
