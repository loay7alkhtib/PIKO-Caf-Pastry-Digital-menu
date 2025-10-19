/**
 * Free Plan Status Component
 *
 * Shows current status of Free Plan optimization and usage
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Download,
  Info,
  RefreshCw,
  TrendingDown,
  Zap,
} from 'lucide-react';

interface FreePlanStatusProps {
  onRefresh?: () => void;
  onGenerateStatic?: () => void;
}

export function FreePlanStatus({
  onRefresh,
  onGenerateStatic,
}: FreePlanStatusProps) {
  // Mock data - in real implementation, this would come from the usage tracker
  const status = {
    isOptimized: true,
    staticFilesGenerated: true,
    cacheHitRate: 95,
    monthlyEgressMB: 185,
    monthlyEgressGB: 0.18,
    monthlyLimitGB: 5,
    dailyRequests: 23,
    dailyLimit: 50,
    costSavings: 100, // percentage
    lastStaticUpdate: '2024-01-15T10:30:00Z',
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 70) return 'default';
    return 'success';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertTriangle className='h-4 w-4' />;
    if (percentage >= 70) return <Info className='h-4 w-4' />;
    return <CheckCircle className='h-4 w-4' />;
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold flex items-center gap-2'>
            <Zap className='h-6 w-6 text-green-600' />
            Free Plan Optimization
          </h2>
          <p className='text-muted-foreground'>
            Supabase Free Plan (5GB/month) - Optimized for zero cost
          </p>
        </div>
        <div className='flex gap-2'>
          <Button onClick={onGenerateStatic} variant='outline' size='sm'>
            <Download className='h-4 w-4 mr-2' />
            Regenerate Static
          </Button>
          <Button onClick={onRefresh} variant='outline' size='sm'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <DollarSign className='h-4 w-4 text-green-600' />
              Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>$0</div>
            <p className='text-xs text-muted-foreground'>
              {status.costSavings}% savings vs Pro Plan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Data Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{status.monthlyEgressMB}MB</div>
            <p className='text-xs text-muted-foreground'>
              of {status.monthlyLimitGB}GB limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Daily Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{status.dailyRequests}</div>
            <p className='text-xs text-muted-foreground'>
              of {status.dailyLimit} limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Cache Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{status.cacheHitRate}%</div>
            <p className='text-xs text-muted-foreground'>static file hits</p>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Status */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <TrendingDown className='h-5 w-5 text-green-600' />
            Optimization Status
          </CardTitle>
          <CardDescription>
            Current optimization status and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Static Menu Files</span>
                <Badge variant='success'>
                  <CheckCircle className='h-3 w-3 mr-1' />
                  Active
                </Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Smart Caching</span>
                <Badge variant='success'>
                  <CheckCircle className='h-3 w-3 mr-1' />
                  Active
                </Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Data Compression</span>
                <Badge variant='success'>
                  <CheckCircle className='h-3 w-3 mr-1' />
                  Active
                </Badge>
              </div>
            </div>

            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Usage Monitoring</span>
                <Badge variant='success'>
                  <CheckCircle className='h-3 w-3 mr-1' />
                  Active
                </Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Fallback Strategy</span>
                <Badge variant='success'>
                  <CheckCircle className='h-3 w-3 mr-1' />
                  Active
                </Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Offline Support</span>
                <Badge variant='success'>
                  <CheckCircle className='h-3 w-3 mr-1' />
                  Active
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            Key performance indicators for Free Plan optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='text-center'>
              <div className='text-3xl font-bold text-green-600'>95%</div>
              <div className='text-sm text-muted-foreground'>
                Egress Reduction
              </div>
              <div className='text-xs text-muted-foreground mt-1'>
                Static files vs direct Supabase
              </div>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-bold text-blue-600'>67%</div>
              <div className='text-sm text-muted-foreground'>
                Size Reduction
              </div>
              <div className='text-xs text-muted-foreground mt-1'>
                Gzip compression
              </div>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-bold text-purple-600'>24h</div>
              <div className='text-sm text-muted-foreground'>
                Cache Duration
              </div>
              <div className='text-xs text-muted-foreground mt-1'>
                Static file TTL
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <Alert>
            <CheckCircle className='h-4 w-4' />
            <AlertDescription>
              <strong>Optimal Configuration:</strong> Your app is fully
              optimized for the Free Plan. Static files are serving 95% of
              requests, keeping costs at $0/month.
            </AlertDescription>
          </Alert>

          <Alert>
            <Info className='h-4 w-4' />
            <AlertDescription>
              <strong>Last Static Update:</strong>{' '}
              {new Date(status.lastStaticUpdate).toLocaleString()}. Consider
              regenerating static files weekly for optimal performance.
            </AlertDescription>
          </Alert>

          <Alert>
            <Info className='h-4 w-4' />
            <AlertDescription>
              <strong>Traffic Capacity:</strong> Current setup can handle
              ~20,000 requests/month. For higher traffic, consider upgrading to
              Pro Plan ($25/month).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
