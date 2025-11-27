Overview

This document defines how Codex agents should interact with this project.
The project is a Next.js application for an HTPC remote control, and it must be developed and executed in a consistent, predictable way.

The primary goals:

Maintain a TypeScript-first codebase

Ensure all agent-executed commands use npm run dev, not production builds

Clean up remaining JS/TS inconsistencies as agents modify or create files

Avoid unnecessary Next.js boilerplate rewrites

Runtime Expectations
Development Server

Agents must always start the application using:

npm run dev

Note: @nut-tree is no longer available on npm public repo. I have published the required module + deps
to /vendor/@nut-tree, and package.json points there. Make sure that the npm install is not
erroring out trying to fetch the package from npm.

Under no circumstances should agents:

run next build

run next start

generate production artifacts

rewrite project scripts to add build/start steps

Environment

Node.js 18+

npm preferred (not yarn/pnpm)

.env.local should be respected if present, but agents should not create or modify environment variables unless explicitly instructed.

Code Requirements
TypeScript Enforcement

The project is transitioning from a JS/TS hybrid to full TypeScript.

Agents should:

Create new modules exclusively in .ts or .tsx

Convert existing .js / .jsx files to TypeScript when modifying them

Fix type errors rather than suppress them with any (except in unavoidable external-library cases)

Maintain strict typing where reasonable

Do not:

Introduce JavaScript files unless explicitly requested

Add TypeScript boilerplate configs unless asked (tsconfig is already in place)

UI / Functionality Scope

Agents may modify or add:

Remote-control pages

Keybinding logic

ECP / Roku / HTPC control endpoints

API routes for backend integrations

Styling (Tailwind preferred if used in project)

Agents must not:

Introduce design systems, component libraries, or global rewrites unless instructed

Remove existing functionality intentionally or “refactor for style”

Coding Standards
General

Follow existing formatting (Prettier if configured)

Keep modules focused and small

Avoid speculative abstraction (no factories, no “services layer” unless needed)

React / Next.js

Use functional components and hooks

Server components only where compatible with Next.js App Router

Prefer client components when interacting with DOM or browser APIs

APIs

Keep API routes minimal

Must return JSON

Use TypeScript for request/response types

Agent Behavior Guidelines
Allowed

Create new components/pages in TS

Implement features directly

Fix type issues

Improve reliability of remote functions

Add tests if appropriate

Not Allowed

Running production builds

Replacing Next.js with another framework

Introducing runtime dependencies not aligned with the current stack

Moving/renaming major directories

Rewriting the system architecture unless explicitly authorized

Commands Summary
Action	Command
Start dev server	npm run dev
Lint (if available)	npm run lint
Typecheck	npm run typecheck or tsc --noEmit
Do not run	next build, next start