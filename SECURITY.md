# Security Policy

## Supported Versions

Only the latest version of PolyLance is currently supported with security updates.

## Reporting a Vulnerability

If you discover a security vulnerability within PolyLance, please send an e-mail to security@polylance.com (dummy). All security vulnerabilities will be promptly addressed.

## Security Practices

- **Smart Contracts**: All contracts are built with OpenZeppelin's secure implementation.
- **Access Control**: Roles are strictly managed via `AccessControl`.
- **Escrow**: Reentrancy guards are used on all state-changing functions.
- **Frontend**: CSP headers and security linting are enforced.
