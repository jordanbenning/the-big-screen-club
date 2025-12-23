# The Big Screen Club

A web application for creating movie clubs, suggesting and voting on movies, and comparing ratings.

## Project Structure

This is a monorepo containing:

- `frontend/` - React + TypeScript frontend (Vite)
- `backend/` - Node.js + Express + TypeScript backend

## Setup

This project uses pnpm workspaces for monorepo management.

### Install Dependencies

```bash
pnpm install --store-dir .pnpm-store
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
