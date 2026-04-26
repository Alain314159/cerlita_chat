---
name: cerlita-security-auditor
description: Security auditing expert. Use to identify vulnerabilities, review token management, audit RLS policies, and ensure safe data handling across the app.
---

# Cerlita Security Auditor

This skill enforces a strict security posture for the Cerlita Chat application.

## Auditing Areas

1. **Token Storage:** Ensure sensitive tokens (Supabase sessions, FCM tokens) are never stored in plain text (e.g., `AsyncStorage`). Enforce the use of `expo-secure-store`.
2. **Data Leakage:** Prevent sensitive information from being logged to the console in production environments (`__DEV__` checks required).
3. **API & Database Access:** Verify that all Supabase interactions occur through the established service layer with proper authorization headers. Audit RLS policies to prevent lateral data movement.
4. **Input Validation:** Ensure all user inputs (chat messages, profile updates) are sanitized and do not allow injection attacks.

## Security Review Workflow

When instructed to audit a feature:
1. Trace the data flow from user input to database storage.
2. Inspect the persistence mechanisms for any access tokens involved.
3. Review the RLS policies related to the affected tables.
4. Report any vulnerabilities and proactively refactor the code to eliminate the risks.
