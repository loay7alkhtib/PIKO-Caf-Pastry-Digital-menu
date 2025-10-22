import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { supabaseClient as supabase } from '../lib/supabase';
import { AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

export default function StorageStatus() {
  const [storageStatus, setStorageStatus] = useState<
    'checking' | 'working' | 'error'
  >('checking');
  const [errorMessage, setErrorMessage] = useState('');

  const checkStorageStatus = async () => {
    try {
      // Try to list files in the menu-images bucket
      const { error } = await supabase.storage
        .from('menu-images')
        .list('', { limit: 1 });

      if (error) {
        if (
          error.message.includes('not found') ||
          error.message.includes('bucket')
        ) {
          setStorageStatus('error');
          setErrorMessage('Storage bucket "menu-images" not found');
        } else {
          setStorageStatus('error');
          setErrorMessage(error.message);
        }
      } else {
        setStorageStatus('working');
      }
    } catch {
      setStorageStatus('error');
      setErrorMessage('Failed to check storage status');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void checkStorageStatus();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (storageStatus === 'checking') {
    return null; // Don't show anything while checking
  }

  if (storageStatus === 'working') {
    return (
      <Alert className='mb-4 border-green-200 bg-green-50'>
        <CheckCircle className='h-4 w-4 text-green-600' />
        <AlertDescription className='text-green-800'>
          ✅ Supabase Storage is working! Images will be uploaded to cloud
          storage.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className='mb-4 border-orange-200 bg-orange-50'>
      <AlertTriangle className='h-4 w-4 text-orange-600' />
      <AlertDescription className='text-orange-800'>
        <div className='space-y-2'>
          <p>
            <strong>⚠️ Storage Issue:</strong> {errorMessage}
          </p>
          <p className='text-sm'>
            Images will be stored as base64 in the database (slower but works).
            For better performance, set up Supabase Storage:
          </p>
          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              window.open(
                'https://supabase.com/dashboard/project/jppymhzgprvshurcqmdn/storage/buckets',
                '_blank',
              )
            }
            className='gap-2'
          >
            <ExternalLink className='w-4 h-4' />
            Open Supabase Dashboard
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
