# Copilot Instructions for OrderBookerTargetTracker

## Project Overview
This is a desktop application built with Tauri and React to help manage business operations of wholesalers in Pakistan. The application tracks order bookers, their targets, and performance metrics.

## Tech Stack
- Frontend: React, TypeScript, Ant Design
- State Management: React Context API and custom hooks
- UI Framework: Ant Design with custom theming
- Testing: Vitest

## Design System
The application uses a customized version of Ant Design with specific theme configurations for wholesaler business operations. Key considerations:

1. User profile: Tech-savvy users who aren't software experts
2. Business context: Wholesale operations in Pakistan
3. Focus on data visualization, tables, and forms for business operations

The design system prioritizes clarity, business-focused layouts, and cultural appropriateness for Pakistani users. See `design-system-guidelines.md` for comprehensive guidance.

## Project Structure
- `src/features/`: Contains domain-specific feature modules
- `src/shared/`: Cross-cutting concerns and shared components
- `src/contexts/`: React context providers
- `src/config/`: Application configuration including theme settings
- `src-tauri/`: Rust backend code

## Development Guidelines
1. Follow the established feature module pattern for new features
2. Utilize shared components from `src/shared/components/`
3. Follow the design system guidelines for UI consistency
4. Write tests for new features
5. Consider localization needs for Pakistani users

## React Best Practices
1. **Component Structure**
   - Use functional components with hooks instead of class components
   - Keep components small and focused on a single responsibility
   - Implement container/presenter pattern for complex components
   - Extract reusable logic into custom hooks

2. **Performance Optimization**
   - Memoize expensive calculations with `useMemo`
   - Prevent unnecessary re-renders with `React.memo` and `useCallback`
   - Implement virtualization for long lists (using `react-window` or similar)
   - Use code splitting with `React.lazy` and `Suspense` for larger features

3. **State Management**
   - Use local state for UI-specific state
   - Use context for shared state within a feature
   - Keep context providers as close as possible to where they're needed
   - Avoid prop drilling by leveraging context appropriately

4. **Side Effects**
   - Handle side effects in useEffect with proper cleanup
   - Separate data fetching logic from rendering components
   - Use dependency arrays correctly in hooks to prevent infinite loops
   - Implement error boundaries around feature components

## TypeScript Best Practices
1. **Type Definitions**
   - Define interfaces for component props in the same file as the component
   - Use type inference where possible, explicit types where necessary
   - Create and reuse type definitions for domain objects in `types` directories
   - Use discriminated unions for state that can exist in multiple forms

2. **Type Safety**
   - Avoid using `any` type; use `unknown` when type is truly unknown
   - Leverage TypeScript's utility types (Pick, Omit, Partial, etc.)
   - Use const assertions for literal values (`as const`)
   - Enable strict mode in tsconfig.json

3. **API Typing**
   - Create strong types for API requests and responses
   - Use zod or similar for runtime validation of API data
   - Define function signatures with explicit return types
   - Use generics for reusable components and functions

4. **Organization**
   - Export types from feature modules when they need to be shared
   - Use barrel exports (index.ts files) to simplify imports
   - Keep type definitions close to their implementation
   - Use namespaces sparingly, prefer ES modules

5. **General Instructions**
   - 1. we use dashboard-store naming convention
   - 2. We don't have different users
   - 3. We dont use it on mobile
   - 4. We use kebab-case for file naming 
## Design System References
- Theme configuration: `src/config/theme.ts`
- Application context: `src/contexts/AppContext.tsx`
- Design guidelines: `.github/design-system-guidelines.md`
