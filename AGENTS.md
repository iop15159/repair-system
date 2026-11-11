# Repository Guidelines

## Project Structure & Module Organization

This workspace currently contains only `報修需求筆記.txt`, the requirements for a demonstration repair-reporting system. There is no application code, dependency manifest, test suite, or Git repository yet. Read the requirements before implementing features.

When implementation begins, organize application code in `src/`, tests in `tests/`, static assets in `public/`, and Supabase schema migrations and policies in `supabase/`. Keep supporting spreadsheets, presentations, and operating instructions in `docs/`. These directories are proposed conventions, not existing components.

## Build, Test, and Development Commands

No build, test, development, lint, or formatting commands are currently configured. Do not assume that `npm test` or `npm run build` works. When choosing a stack, document its installation, local development, build, and test commands in `README.md`, and commit the appropriate dependency manifest and lockfile.

## Coding Style & Naming Conventions

Follow the conventions of the selected language and formatter consistently. No indentation standard or linting tool has been established; configure these when adding code. Use descriptive names such as `RepairForm` and `RepairList`, and keep filenames consistent within each module. Preserve Traditional Chinese labels and the category, urgency, and status values specified in the requirements.

## Testing Guidelines

No testing framework or coverage threshold exists yet. Add behavior-focused tests alongside implementation, using the selected framework's standard naming convention. Cover required fields, report submission, list display, and automatically generated registration timestamps. Verify Supabase policies allow public inserts and reads while rejecting updates and deletes.

## Commit & Pull Request Guidelines

There is no Git history from which to infer commit conventions. After Git initialization, use concise imperative subjects, for example `Add repair submission form`. Pull requests should describe the change, reference relevant requirements or issues, record validation performed, and include screenshots for visible interface changes.

## Security & Scope

Use fictional names and locations in all demonstration data. Enable Supabase row-level security before exposing the public client key; never commit privileged service keys. The current demonstration covers submission and listing without login. Status updates, authentication, and notifications remain unresolved requirements; clarify their scope before implementation.
