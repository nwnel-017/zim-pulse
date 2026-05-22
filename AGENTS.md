<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Coding Style

- DO NOT manually edit add or remove migration files
- when you make changes to schema - do not run migration scripts
- Always ask for approval before applying changes
- Only focus on the specific instruction you are given. Do not focus on other errors or other functionality when given a task.
- Do not make a change unless you are specifically asked to.
- Next js components are always .tsx files
- This app is built with Next.js, TypeScript, Vanilla CSS, PostgreSQL, and Prisma ORM
- This app uses Better Auth for authentication
- Look at Next js docs for best practices
- Use SOLID Principles
- When writing css and html - use dynamic sizing (%, rem, em, dvh, dvw) instead of using fixed pixel sizes, except for images.
- Use a mobile first approach when writing css and html. Use min-width 768px and min-width 1024px for media queries.

## Scripts You Can Run

- generic get content / list content scripts
- npm run dev
- npm run lint
- npm run build
- IMPORTANT - do not run any other scripts without permission

## Architecture

- Before adding files or directories, please look at the project structure and match the same structure
- When creating a component - use css modules for scoped component styles

## Project structure

- I am structuring my project with a features based directory
- components that are feature specific are put inside the relevant sub-directory (ex: app/admin/\_components)
- if a component is truly reusable (ex: nav-bar), then put it in src/components

 <!-- END:nextjs-agent-rules -->
