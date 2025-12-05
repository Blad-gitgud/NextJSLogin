# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please **do not** open a public issue. Instead, email the maintainer at [your-email@example.com] with details including:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

We will acknowledge receipt within 48 hours and work to resolve the issue promptly.

## Security Best Practices

This project implements the following security measures:

### Authentication & Authorization
- HTTP-only cookies are forwarded from the backend and should have `HttpOnly`, `Secure`, and `SameSite` attributes set by the backend.
- Tokens are stored server-side when possible. Avoid storing sensitive credentials in localStorage.
- All auth endpoints are proxied through Next.js API routes to prevent direct exposure of backend URLs.

### Headers & Policies
- Content Security Policy (CSP) restricts script and resource loading to trusted sources.
- X-Frame-Options prevents clickjacking attacks.
- X-Content-Type-Options prevents MIME type sniffing.
- Strict-Transport-Security (HSTS) enforces HTTPS in production.

### Logging & Data Protection
- Credentials (usernames, passwords) are not logged.
- Cookie values and authorization headers are not logged to console.
- Sensitive request bodies are not exposed in debug logs.

### Dependency Management
- Run `npm audit` regularly and update dependencies when security patches are available.
- Use Dependabot (GitHub) for automated dependency scanning.

## Environment Variables

**Never commit `.env.local` or any file containing secrets.** The `.gitignore` excludes `.env*` files.

See `.env.example` for required variables.

## Production Checklist

Before deploying to production:

- [ ] Set all environment variables securely (use hosting provider's secret management).
- [ ] Ensure backend sets cookies with `HttpOnly; Secure; SameSite=Strict`.
- [ ] Enable HTTPS and HSTS.
- [ ] Run `npm audit` and resolve any high/critical vulnerabilities.
- [ ] Review CSP policy and adjust `Content-Security-Policy` header if needed.
- [ ] Set `NODE_ENV=production` in your hosting environment.
- [ ] Test all auth flows (login, logout, token refresh) in a staging environment.
- [ ] Monitor logs for suspicious activity.

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)