/**
 * Session Manager - Handles session persistence and recovery
 */

const SESSION_KEY = 'piko_session';
const SESSION_TIMESTAMP_KEY = 'piko_session_timestamp';
const SESSION_EXPIRY_DAYS = 7; // Sessions expire after 7 days

interface Session {
  access_token: string;
  user: {
    email: string;
    name?: string;
    isAdmin?: boolean;
    id?: string;
  };
}

/**
 * Save session to localStorage with timestamp
 */
export function saveSession(session: Session): void {
  try {
    if (typeof localStorage === 'undefined') return;

    // Validate session structure before saving
    if (!session || !session.user) {
      console.error('❌ Invalid session structure:', session);
      return;
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());

    console.warn('💾 Session saved:', {
      email: session.user.email,
      isAdmin: session.user.isAdmin,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to save session:', error);
  }
}

/**
 * Load session from localStorage
 */
export function loadSession(): Session | null {
  try {
    if (typeof localStorage === 'undefined') return null;

    const sessionStr = localStorage.getItem(SESSION_KEY);
    const timestampStr = localStorage.getItem(SESSION_TIMESTAMP_KEY);

    if (!sessionStr || sessionStr === 'undefined' || sessionStr === 'null') {
      console.warn('ℹ️ No valid session in storage');
      return null;
    }

    // Check if session is expired
    if (timestampStr) {
      const timestamp = parseInt(timestampStr, 10);
      const age = Date.now() - timestamp;
      const maxAge = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 7 days in ms

      if (age > maxAge) {
        console.warn('⏰ Session expired, clearing...');
        clearSession();
        return null;
      }
    }

    const session = JSON.parse(sessionStr);

    // Validate session structure
    if (!session || !session.user) {
      console.warn('❌ Invalid session structure, clearing...');
      clearSession();
      return null;
    }

    console.warn('✅ Session loaded from storage:', {
      email: session.user?.email,
      isAdmin: session.user?.isAdmin,
      age: timestampStr
        ? `${Math.floor((Date.now() - parseInt(timestampStr, 10)) / 1000 / 60)} minutes`
        : 'unknown',
    });

    return session;
  } catch (error) {
    console.error('❌ Failed to load session:', error);
    clearSession();
    return null;
  }
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
  try {
    if (typeof localStorage === 'undefined') {
      console.warn('⚠️ localStorage not available');
      return;
    }

    console.warn('🗑️ Clearing session from localStorage...');
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TIMESTAMP_KEY);

    // Verify session was cleared
    const sessionStillExists = localStorage.getItem(SESSION_KEY) !== null;
    if (sessionStillExists) {
      console.error('❌ Session still exists after clear attempt');
    } else {
      console.warn('✅ Session successfully cleared');
    }
  } catch (error) {
    console.error('❌ Failed to clear session:', error);
  }
}

/**
 * Check if session exists
 */
export function hasSession(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(SESSION_KEY) !== null;
}

/**
 * Get session age in minutes
 */
export function getSessionAge(): number | null {
  if (typeof localStorage === 'undefined') return null;

  const timestampStr = localStorage.getItem(SESSION_TIMESTAMP_KEY);
  if (!timestampStr) return null;

  const timestamp = parseInt(timestampStr, 10);
  return Math.floor((Date.now() - timestamp) / 1000 / 60); // age in minutes
}

/**
 * Update session timestamp (keep alive)
 */
export function touchSession(): void {
  if (typeof localStorage === 'undefined') return;
  if (!hasSession()) return;

  localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
  console.warn('👆 Session touched');
}
