---
name: react-god-file-refactoring
description: Refactor React codebases that contain God Files into small, focused, maintainable modules while preserving existing behavior.
---

# React God File Refactoring Skill

## Purpose

Refactor React codebases that contain **God Files** into small, focused, maintainable modules while preserving existing behavior.

The primary architectural principle is:

> **One module should have one clear responsibility, and each responsibility should live at the appropriate architectural layer.**

This skill must prioritize:

1. Separation of Concerns
2. Single Responsibility Principle
3. Maintainability
4. Testability
5. Reusability
6. Clear dependency direction
7. Minimal coupling
8. Preservation of existing behavior
9. Incremental and low-risk refactoring
10. Explicit boundaries between UI, state, business logic, API, and utilities

---

# 1. What Is a God File?

A God File is a file that knows or does too much.

In a React application, examples include components that simultaneously contain:

* UI rendering
* API calls
* form handling
* validation
* business rules
* state management
* data transformation
* authentication logic
* navigation
* notifications
* modal management
* table configuration
* filtering
* sorting
* pagination
* local storage access
* analytics
* error handling
* reusable utility functions

---

# 2. Core Principle: Separation of Concerns

Always separate code according to responsibility.

A typical React application should distinguish between:

```text
Presentation
    ↓
Application / Hooks
    ↓
Domain / Business Logic
    ↓
Data / API
    ↓
Infrastructure
```

The exact architecture may vary, but responsibilities must remain explicit.

---

# 3. Recommended React Structure

Prefer feature-oriented organization.

```text
src/
├── app/
│   ├── routes/
│   ├── providers/
│   └── layouts/
│
├── features/
│   └── users/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── domain/
│       ├── schemas/
│       ├── utils/
│       └── pages/
│
├── components/
│   ├── ui/
│   └── layout/
│
├── hooks/
├── services/
├── utils/
└── types/
```

Do not automatically create folders just for the sake of abstraction.
Create a module when there is a meaningful responsibility boundary.

---

# 4. Component Responsibility

A React component should primarily be responsible for:

* Rendering UI
* Receiving props
* Handling UI-level events
* Composing smaller components
* Connecting UI to application hooks

A component should NOT normally be responsible for:

* Direct database access
* Complex API implementations
* Large business rules
* Complex data transformations
* Generic utility logic
* Large validation systems
* Authentication infrastructure
* Complex state machines
* Reusable domain calculations

---

# 5. Component Decomposition Rules

When a component becomes large, identify distinct UI responsibilities.
Each component should answer one question. The parent should compose these pieces instead of implementing everything.

---

# 6. Hook Responsibility

Custom hooks should encapsulate reusable React-specific behavior.

Good candidates:
* `useUsers()`
* `useUserFilters()`
* `useUserForm()`
* `useDeleteUser()`
* `usePagination()`
* `useDebouncedSearch()`

The component should not need to understand the implementation details.

---

# 7. Do Not Turn Hooks Into God Hooks

A hook can also become a God Hook. Avoid hooks containing fetching, filtering, validation, modal state, navigation, etc. all at once. Prefer focused hooks, then compose them.

---

# 8. API and Service Separation

Components should not contain raw API implementations. The API implementation belongs to the data/service layer.

---

# 9. Business Logic Separation

Business rules must not be hidden inside JSX. Extract meaningful domain functions that can be tested without rendering React.

---

# 10. Data Transformation Separation

Do not perform complex transformations inside components. Extract mapper functions into pure utility or domain modules.

---

# 11. Validation Separation

Validation should not be scattered throughout components. Prefer schema-based validation (e.g. Zod schemas) consumed by forms.

---

# 12. State Separation

Classify state before refactoring:
- Local UI state: keep close to component
- Form state: use form abstraction
- Server state: use TanStack Query / SWR
- Global application state: use Zustand / Context only when genuinely global

---

# 13. Avoid Prop Drilling by Default

Before introducing global state, determine whether the data should instead be moved closer to where it is used, passed through composition, or retrieved through a feature hook.

---

# 14. Keep JSX Declarative

JSX should communicate **what the UI is**, not contain the entire implementation of **why the UI behaves that way**.

---

# 15. Event Handler Separation

Avoid giant event handlers. Move responsibilities into the appropriate layers.

---

# 16. Avoid Premature Abstraction

Do NOT extract code merely because a file is long. Abstractions should represent concepts, not arbitrary chunks of lines.

---

# 17. Extraction Decision Framework

When deciding whether to extract code, ask:
1. Does this code have a different responsibility? (If yes: Extract)
2. Can this code be independently tested? (If yes: Consider extracting)
3. Is this logic reusable? (If yes: Consider extracting)
4. Does the code require different dependencies? (If yes: Consider extracting)
5. Does the code change for a different reason? (If yes: Extract)

---

# 18. Dependency Direction

Prefer dependencies flowing in one direction. Domain logic should ideally be usable without rendering a React component.

---

# 19. Avoid Circular Dependencies

Never allow `A -> B -> C -> A`. Refactor shared concepts into a lower-level module.

---

# 20. Naming Rules

Names should represent responsibility. Avoid generic catch-alls (`helpers`, `common`, `misc`, `manager`, `processor`, `logic`).

---

# 21. File Size Is a Signal, Not a Rule

Focus on low responsibility density, not simply fewer lines.

---

# 22. God File Detection Checklist

Flag a file for refactoring when several of these are present:
* [ ] Component exceeds reasonable complexity
* [ ] Multiple unrelated `useState` calls
* [ ] Multiple `useEffect` blocks with unrelated purposes
* [ ] Direct API calls
* [ ] Complex business rules
* [ ] Large event handlers
* [ ] Large JSX sections
* [ ] Complex data transformation
* [ ] Validation logic
* [ ] Navigation logic
* [ ] Notification logic
* [ ] Modal state management
* [ ] Difficult-to-test functions
* [ ] Duplicate logic

---

# 23. Refactoring Procedure

1. Understand Existing Behavior
2. Build a Responsibility Map
3. Identify Boundaries
4. Extract Pure Functions First
5. Extract Services
6. Extract Custom Hooks
7. Extract UI Components
8. Simplify the Parent

---

# 24. Refactoring Output Format

When performing an actual refactoring, provide the result in this order:

```text
## 1. God File Analysis
## 2. Responsibility Map
## 3. Proposed Architecture
## 4. Refactoring Strategy
## 5. Refactored Files
## 6. Dependency Flow
## 7. Testing Recommendations
## 8. Risks
## 9. Definition of Done
```
