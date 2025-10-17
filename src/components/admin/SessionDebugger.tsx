import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw,
  Trash2,
  Info
} from 'lucide-react';
import { hasSession, getSessionAge, loadSession, clearSession, touchSession } from '../../lib/sessionManager';
import { authAPI } from '../../lib/supabase';

export function SessionDebugger() {
  const [sessionExists, setSessionExists] = useState(false);
  const [sessionAge, setSessionAge] = useState<number | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [serverValid, setServerValid] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = () => {
    setSessionExists(hasSession());
    setSessionAge(getSessionAge());
    setSessionData(loadSession());
  };

  const verifyWithServer = async () => {
    setChecking(true);
    try {
      const { data: { session } } = await authAPI.getSession();
      setServerValid(session !== null);
    } catch (error) {
      setServerValid(false);
    } finally {
      setChecking(false);
    }
  };

  const handleTouch = () => {
    touchSession();
    checkSession();
  };

  const handleClear = () => {
    if (confirm('Clear session? You will be logged out.')) {
      clearSession();
      checkSession();
      setServerValid(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg" style={{ color: '#0C6071' }}>
            Session Debugger
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={checkSession}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Session Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Local Storage</div>
            <div className="flex items-center gap-2">
              {sessionExists ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Exists</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Missing</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Age</div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm">
                {sessionAge !== null ? `${sessionAge} min` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Session Data */}
        {sessionData && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="text-xs text-gray-600">Session Data:</div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Email:</span>
                <span>{sessionData.user?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Name:</span>
                <span>{sessionData.user?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Admin:</span>
                {sessionData.user?.isAdmin ? (
                  <Badge variant="default">Yes</Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Token:</span>
                <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                  {sessionData.access_token?.substring(0, 8)}...
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Server Verification */}
        <div>
          <Button
            size="sm"
            variant="outline"
            onClick={verifyWithServer}
            disabled={!sessionExists || checking}
            className="w-full"
          >
            {checking ? (
              <>
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3 mr-2" />
                Verify with Server
              </>
            )}
          </Button>

          {serverValid !== null && (
            <Alert className={`mt-3 ${serverValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {serverValid ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Session is valid on server
                  </AlertDescription>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Session is invalid on server
                  </AlertDescription>
                </>
              )}
            </Alert>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={handleTouch}
            disabled={!sessionExists}
            className="flex-1"
          >
            <Clock className="h-3 w-3 mr-1" />
            Touch Session
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClear}
            disabled={!sessionExists}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>

        {/* Info */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-xs">
            Sessions expire after 7 days. Use "Touch Session" to update the timestamp.
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  );
}
