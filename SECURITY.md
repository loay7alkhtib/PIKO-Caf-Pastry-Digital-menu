# Security Documentation

## Overview

This document outlines the security measures implemented in the PIKO Café & Pastry Digital Menu application to protect against common vulnerabilities and ensure data integrity.

## Security Measures

### 1. Password Security

#### Password Hashing

- **Algorithm**: PBKDF2 with SHA-256
- **Iterations**: 100,000 iterations
- **Salt**: 16-byte random salt per password
- **Format**: `salt:hash` stored in database

#### Password Requirements

- Minimum length: 6 characters
- Maximum length: 128 characters
- No complexity requirements (for user convenience)

#### Implementation

```typescript
// Password hashing with PBKDF2 and salt
async function hashPassword(password: string, salt?: string): Promise<string> {
  const usedSalt = salt || (await generateSalt());
  // ... PBKDF2 implementation with 100,000 iterations
  return `${usedSalt}:${hash}`;
}
```

### 2. Session Management

#### Session Expiration

- **TTL**: 24 hours (reduced from 30 days)
- **Validation**: Server-side expiration check on every request
- **Cleanup**: Automatic cleanup of expired sessions

#### Session Security

- **Tokens**: Cryptographically secure UUIDs
- **Storage**: Database-backed sessions
- **Validation**: Enhanced expiration validation with current time comparison

#### Implementation

```typescript
// Enhanced expiration check
const now = new Date();
const expiresAt = new Date(session.expires_at);

if (now >= expiresAt) {
  // Clean up expired session
  await supabase.from('sessions').delete().eq('token', token);
  return c.json({ data: { session: null }, error: null });
}
```

### 3. CORS Policy

#### Environment-Based Whitelist

- **Development**: localhost:3000, localhost:5173
- **Production**: Configurable via `ALLOWED_ORIGINS` environment variable
- **Default**: Falls back to localhost for development

#### Implementation

```typescript
const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost:3000',
  'https://localhost:5173',
];
```

### 4. Input Validation

#### XSS Protection

- **HTML Sanitization**: Removes `<` and `>` characters
- **Length Limits**: Maximum 255 characters for strings
- **Input Trimming**: Automatic whitespace removal

#### Data Validation

- **Email Format**: RFC-compliant email validation
- **Price Ranges**: 0 to 999,999 with positive validation
- **Image Data**: Base64 data URL validation with 5MB size limit
- **String Lengths**: Configurable maximum lengths per field

#### Implementation

```typescript
function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().slice(0, maxLength).replace(/[<>]/g, ''); // Basic XSS protection
}
```

### 5. Admin Credentials

#### Environment Variables

- **Admin Email**: `ADMIN_EMAIL` environment variable
- **Admin Password**: `ADMIN_PASSWORD` environment variable
- **Default Fallback**: `admin@piko.com` / `admin123` (with warnings)

#### Security Warnings

- **Production Warning**: Logs warning when using default credentials
- **Environment Check**: Validates environment variables on startup

#### Implementation

```typescript
const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@piko.com';
const adminPassword = Deno.env.get('ADMIN_PASSWORD') || 'admin123';

if (adminEmail === 'admin@piko.com' || adminPassword === 'admin123') {
  console.warn(
    '⚠️ Using default admin credentials. Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables for production.'
  );
}
```

## Security Checklist

### Deployment Security

#### Environment Variables

- [ ] Set `ADMIN_EMAIL` to a secure email address
- [ ] Set `ADMIN_PASSWORD` to a strong password (12+ characters)
- [ ] Set `ALLOWED_ORIGINS` to your production domains
- [ ] Ensure all environment variables are properly configured

#### Database Security

- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Set up proper database permissions
- [ ] Enable connection encryption
- [ ] Regular database backups

#### Server Security

- [ ] Use HTTPS in production
- [ ] Enable security headers
- [ ] Regular security updates
- [ ] Monitor for suspicious activity

### Development Security

#### Code Security

- [ ] Run `npm run lint` to check for security issues
- [ ] Use TypeScript strict mode
- [ ] Regular dependency updates
- [ ] Security-focused code reviews

#### Testing Security

- [ ] Run security tests: `npm run test:security`
- [ ] Test input validation
- [ ] Test authentication flows
- [ ] Test session management

## Security Testing

### Automated Tests

- Password hashing validation
- Session expiration checks
- CORS policy validation
- Input sanitization tests
- Authentication flow tests

### Manual Testing

- Penetration testing
- Security scanning
- Vulnerability assessment
- Code review

## Incident Response

### Security Incident Procedure

1. **Immediate Response**
   - Isolate affected systems
   - Preserve evidence
   - Notify stakeholders

2. **Investigation**
   - Analyze logs
   - Identify attack vector
   - Assess damage

3. **Recovery**
   - Patch vulnerabilities
   - Update security measures
   - Monitor for recurrence

4. **Post-Incident**
   - Document lessons learned
   - Update security procedures
   - Conduct security review

## Security Updates

### Regular Maintenance

- **Monthly**: Security dependency updates
- **Quarterly**: Security review and testing
- **Annually**: Comprehensive security audit

### Monitoring

- **Log Analysis**: Regular review of access logs
- **Performance Monitoring**: Unusual activity detection
- **Error Tracking**: Security-related error monitoring

## Contact Information

### Security Issues

- **Email**: security@piko.com
- **Response Time**: 24 hours for critical issues
- **Severity Levels**: Critical, High, Medium, Low

### Reporting Vulnerabilities

1. Email security team with details
2. Include steps to reproduce
3. Provide impact assessment
4. Wait for acknowledgment

## Compliance

### Data Protection

- **GDPR**: European data protection compliance
- **CCPA**: California privacy rights
- **Local Laws**: Compliance with local regulations

### Security Standards

- **OWASP**: Following OWASP security guidelines
- **Industry Standards**: Adherence to industry best practices
- **Regular Audits**: Third-party security assessments

---

**Last Updated**: December 2024
**Version**: 1.0
**Review Date**: March 2025
