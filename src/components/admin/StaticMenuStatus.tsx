import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface StaticMenuStatusProps {
  onRegenerate?: () => void;
}

interface MenuStatus {
  exists: boolean;
  isUpToDate: boolean;
  lastGenerated?: string;
  size?: string;
  needsRegeneration: boolean;
}

export default function StaticMenuStatus({
  onRegenerate,
}: StaticMenuStatusProps) {
  const [status, setStatus] = useState<MenuStatus | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Check static menu status
  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/static/menu.json');
      if (response.ok) {
        const menuData = await response.json();
        setStatus({
          exists: true,
          isUpToDate: true,
          lastGenerated: menuData.generatedAt,
          size: `${(response.headers.get('content-length') || 0) / 1024} KB`,
          needsRegeneration: false,
        });
      } else {
        setStatus({
          exists: false,
          isUpToDate: false,
          needsRegeneration: true,
        });
      }
    } catch (error) {
      console.error('Failed to check static menu status:', error);
      setStatus({ exists: false, isUpToDate: false, needsRegeneration: true });
    } finally {
      setIsChecking(false);
    }
  };

  // Regenerate static menu
  const regenerateMenu = async () => {
    setIsRegenerating(true);
    try {
      // For Vite projects, we'll show instructions to run the command
      toast.info('Static Menu Regeneration', {
        description:
          'Run "npm run generate:static" in your terminal to regenerate the static menu.',
        duration: 5000,
      });

      // Refresh status after a delay
      setTimeout(async () => {
        await checkStatus();
        onRegenerate?.();
      }, 2000);
    } catch (error) {
      console.error('Failed to regenerate static menu:', error);
      toast.error('Failed to regenerate static menu', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // Check status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  if (!status) {
    return (
      <Alert>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>Checking static menu status...</AlertDescription>
      </Alert>
    );
  }

  const getStatusIcon = () => {
    if (status.needsRegeneration) {
      return <AlertCircle className='h-4 w-4 text-orange-500' />;
    } else if (status.isUpToDate) {
      return <CheckCircle className='h-4 w-4 text-green-500' />;
    } else {
      return <Clock className='h-4 w-4 text-blue-500' />;
    }
  };

  const getStatusText = () => {
    if (!status.exists) {
      return 'Static menu not found';
    } else if (status.needsRegeneration) {
      return 'Static menu needs regeneration';
    } else if (status.isUpToDate) {
      return 'Static menu is up to date';
    } else {
      return 'Static menu status unknown';
    }
  };

  const getStatusBadge = () => {
    if (status.needsRegeneration) {
      return <Badge variant='destructive'>Needs Update</Badge>;
    } else if (status.isUpToDate) {
      return (
        <Badge variant='default' className='bg-green-500'>
          Up to Date
        </Badge>
      );
    } else {
      return <Badge variant='secondary'>Unknown</Badge>;
    }
  };

  return (
    <div className='space-y-4'>
      <Alert>
        {getStatusIcon()}
        <AlertDescription className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <span>{getStatusText()}</span>
            {getStatusBadge()}
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={checkStatus}
              disabled={isChecking}
            >
              {isChecking ? (
                <RefreshCw className='h-4 w-4 animate-spin' />
              ) : (
                <RefreshCw className='h-4 w-4' />
              )}
            </Button>
            <Button
              size='sm'
              onClick={regenerateMenu}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <RefreshCw className='h-4 w-4 animate-spin' />
              ) : (
                <RefreshCw className='h-4 w-4' />
              )}
              Regenerate
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {status.lastGenerated && (
        <div className='text-sm text-muted-foreground'>
          <p>
            Last generated: {new Date(status.lastGenerated).toLocaleString()}
          </p>
          {status.size && <p>Size: {status.size}</p>}
        </div>
      )}

      {status.needsRegeneration && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            <strong>Action Required:</strong> The public menu may not reflect
            your latest changes. Click "Regenerate" to update the static menu
            and make changes visible to customers.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
