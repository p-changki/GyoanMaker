## Tailwind v4 Foundation & Design Tokens

- **Tailwind v4 Import**: Added `@import "tailwindcss";` to `src/app/globals.css`.
- **Design Tokens**: Defined CSS variables in `:root` for the primary, secondary, background, foreground, muted, success, destructive, and warning colors.
- **Tailwind Config**: Updated `tailwind.config.js` to map these CSS variables to Tailwind theme colors using `var(--color-*)`.
- **Global Styles**: Updated `body` to use `--color-background` and `--color-foreground` by default.
- **Verification**: `npm run type-check` passed for the `src/` directory (pre-existing errors in `references/` ignored). `npm run lint` failed due to pre-existing ESLint configuration issues in the template.

### App Shell & Layout (Phase 0)
- Established a consistent app shell using `AppShell` and `Header` components.
- Set the default language to Korean (`ko`) in the root layout.
- Chose a max-width of `1100px` for the main container to provide a comfortable reading experience on desktop while maintaining a clean, centered look.
- Used a light background (`#f8f9fc`) for the shell to contrast with the white content area, following the established CSS tokens.

## T1-1: Define result schema and UI state TypeScript types
- Created `src/lib/types.ts` to centralize core data structures.
- Types include `PassageResult`, `VocabRelated`, `CoreVocabItem`, and UI state types like `InputMode` and `OutputOptionState`.
- Verified that `references/` is correctly excluded in `tsconfig.json` and `eslint.config.mjs`.
- Session storage key: `gyoanmaker:input`
- Payload includes `inputMode`, `textBlock`, `cards`, `passages`, `options`, `generationMode`, and `timestamp`.
- Max 20 passages limit is enforced in both modes.
- Toggle between modes preserves content using `src/lib/parsePassages.ts` utils.

### CopyButton API Choice
- **Choice**: `getText: () => string`
- **Reason**: Preferred for cases where the text to be copied might be expensive to compute or depends on the latest state at the moment of clicking. This approach is more flexible for the results page where multiple sections or the entire passage might be formatted on demand.

### Results Page Implementation
- **ResultCard Component**: A comprehensive component for rendering passage analysis results. It handles three states: `generating`, `completed`, and `failed`.
- **SectionHeader Component**: A reusable header for card sections that includes a title and a copy button.
- **JsonModal Component**: A simple, accessible modal for viewing raw JSON data.
- **State Management**: The `/results` page manages a list of `ResultItem`s, each with its own status and data. This allows for per-card interactions like regeneration and retry.
- **Copy UX**: Standardized copy buttons using `CopyButton` with 1.5s feedback. Formatting is handled by `src/lib/formatText.ts`.
- **Accessibility**: Modals and buttons include proper ARIA roles and labels.
