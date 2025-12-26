# Backend Scripts

This directory contains utility scripts for database maintenance and data migration.

## Available Scripts

### fix-orphaned-invitations.ts

**Purpose:** Fixes orphaned club invitations that were created before the notification system was implemented.

**What it does:**

- Finds all pending club invitations that don't have corresponding notifications
- Creates notifications for these orphaned invitations
- Allows users to see and respond to invitations that were previously invisible

**When to use:**

- After adding the notification feature to fix existing invitations
- If users report being unable to re-invite someone who "already has a pending invitation"

**How to run:**

```bash
cd backend
pnpm run fix-orphaned-invitations
```

**Note:** This script should be safe to run multiple times - it only creates notifications for invitations that don't already have them.

## Automatic Fix

As of the latest update, the `inviteMember` function in `clubService.ts` now automatically detects and fixes orphaned invitations when an admin attempts to re-invite a user. This means:

- If an orphaned invitation exists, it will automatically create the missing notification
- The manual script is still useful for batch-fixing all orphaned invitations at once
