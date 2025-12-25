# The Big Screen Club

A web application for creating movie clubs, suggesting and voting on movies, and comparing ratings.

## Features

### ✅ Authentication & User Management (Completed)

- ✅ User registration with email verification
- ✅ Session-based authentication with PostgreSQL session store
- ✅ Password hashing with bcrypt
- ✅ Email verification system with Ethereal Email (dev) integration
- ✅ Email resend functionality
- ✅ Login with email or username
- ✅ "Remember Me" functionality (7 or 30 day sessions)
- ✅ Forgot password flow with reset tokens
- ✅ Password reset via email
- ✅ User dashboard with profile information
- ✅ Account deletion with password confirmation
- ✅ Landing page with Sign Up / Log In
- ✅ Protected and public-only routes
- ✅ Secure session cookies with httpOnly
- ✅ Session state tracking (localStorage)
- ✅ Comprehensive test coverage

### ✅ Movie Clubs (Completed)

- ✅ Create movie clubs with name, description, and profile picture
- ✅ Public/private club settings
- ✅ Automatic admin assignment for club creators
- ✅ View all clubs user is a member of
- ✅ Club member count tracking
- ✅ 12-member limit per club
- ✅ Profile picture upload (JPEG/PNG, max 5MB)
- ✅ Empty state and club grid display
- ✅ Form validation (name 3-50 chars, description max 500 chars)

### 🚧 Planned Features

#### Movie Clubs (Phase 2)

- Invite members to clubs
- Accept/reject club invitations
- Public club discovery and join requests
- Edit club settings
- Leave/delete clubs
- Club activity feed

#### Film Management

- Suggest films to watch
- Vote on film suggestions
- Film watch history per club
- Film ratings and reviews
- Compare ratings across club members

#### Timestamp Comments (Key Feature)

- **Add comments to specific timestamps in films during playback**
- **View comments synchronized with video playback**
- **Reply to timestamp comments**
- **Like/react to timestamp comments**
- **Video player integration with comment markers on timeline**
- Jump to specific timestamps from comments
- Filter comments by timestamp range

#### Additional Features

- Film discussion threads
- Watch party scheduling
- User profiles and avatars
- Notification system
- Search and filter films
- External API integration (TMDB/OMDB)

## Project Structure

This is a monorepo containing:

- `frontend/` - React + TypeScript frontend (Vite)
- `backend/` - Node.js + Express + TypeScript backend

## Setup

This project uses pnpm workspaces for monorepo management.

### Prerequisites

- **Node.js** v20 or higher
- **PostgreSQL** 14 or higher
- **pnpm** v10 or higher

### Install Dependencies

```bash
pnpm install --store-dir .pnpm-store
```

### Database Setup

1. **Install PostgreSQL** (if not already installed):

   ```bash
   # macOS (using Homebrew)
   brew install postgresql@14
   brew services start postgresql@14

   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Create the database**:

   ```bash
   # Connect to PostgreSQL
   psql postgres

   # In PostgreSQL shell, create database and user
   CREATE DATABASE bigscreenclub;
   CREATE USER postgres WITH PASSWORD 'postgres';
   GRANT ALL PRIVILEGES ON DATABASE bigscreenclub TO postgres;
   \q
   ```

3. **Configure environment variables**:

   ```bash
   # Backend environment variables are already set in backend/.env
   # Update DATABASE_URL if your PostgreSQL credentials differ
   ```

4. **Run database migrations**:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

### Development

Run both frontend and backend concurrently:

```bash
pnpm dev
```

Or run them individually:

```bash
# Frontend only
pnpm dev:frontend

# Backend only
pnpm dev:backend
```

- Frontend runs on `http://localhost:5173` (Vite default)
- Backend runs on `http://localhost:3000` (Express default)

### Testing Authentication

1. **Start both servers** (backend and frontend)
2. **Navigate to** `http://localhost:5173`
3. **Click "Sign Up"** and create an account
4. **Check the backend console** for the email preview link (using Ethereal Email for development)
5. **Click the verification link** to verify your email and log in

**Email Service (Development):**

- The app uses Ethereal Email (fake SMTP) for development
- Email preview links are logged in the backend console
- For production, configure real SMTP credentials in `backend/.env`

## Code Quality

### Linting

This project uses ESLint with strict TypeScript rules, React hooks validation, and accessibility checks.

```bash
# Lint all workspaces
pnpm lint

# Lint and auto-fix issues
pnpm lint:fix

# Lint specific workspace
pnpm --filter big-screen-club-frontend lint
pnpm --filter big-screen-club-backend lint
```

### Formatting

This project uses Prettier for code formatting.

```bash
# Format all files
pnpm format

# Check formatting without modifying files
pnpm format:check
```

### ESLint Configuration

- **Shared config** (`eslint.config.mjs`) - Base TypeScript rules applied to all workspaces
- **Frontend config** (`frontend/eslint.config.mjs`) - React, React Hooks, and JSX accessibility rules
- **Backend config** (`backend/eslint.config.mjs`) - Node.js-specific rules

### Key Rules

- **Strict TypeScript**: No `any`, explicit null checks, consistent type imports
- **Import ordering**: Automatic import sorting and organization
- **React best practices**: Hooks exhaustive deps, no unstable nested components
- **Accessibility**: Comprehensive a11y rules for React components
- **Prettier integration**: Automatic code formatting on save (with VSCode)

### Pre-commit Hooks

This project uses **Husky** and **lint-staged** to automatically lint and format code before commits. When you commit:

1. Only **staged files** are checked (not the entire codebase)
2. ESLint runs with auto-fix enabled
3. Prettier formats the code
4. If there are any unfixable lint errors, the commit is **blocked**

This ensures that no code with lint errors ever makes it into the repository.

**What gets checked:**

- `frontend/**/*.{ts,tsx,js,jsx}` - Linted with ESLint + formatted with Prettier
- `backend/**/*.{ts,js}` - Linted with ESLint + formatted with Prettier
- `*.{json,css,md}` - Formatted with Prettier

If a commit is blocked, fix the errors shown in the output and try committing again.
