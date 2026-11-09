# Events SPA + TypeScript

This application should feel familiar. You worked on creating a front end app with React as a client to the [Events API](https://github.com/WebDev-WBSCodingSchool/events-api). Today we have a new challenge: Add type annotations to the app until the build process throws no errors!

You'll see, this app works but since it lacks type annotations, the TypeScript compiler is not happy. Your job is to add those annotations so scaling this app and adding new features is better for you as a developer and less error prone.

## Setup

1. Make sure to setup the [Events API](https://github.com/WebDev-WBSCodingSchool/events-api), you'll need that app running and it's base URL, e.g. `http://localhost:3001/api`
2. Clone this repo into your local computer
3. Create a `.env.development.local` file with a `VITE_EVENTS_API_URL` pointing to the base URL of your events API
4. Install dependencies and spin up the development server
5. The app should work!

## Directory and project structure

```bash
.
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── public
│   ├── 404.gif
│   └── icon.ico
├── README.md
├── src
│   ├── __tests__
│   │   └── integration # Here you need to create your integration tests!
│   │       └── setup.integration.ts
│   ├── actions
│   ├── App.tsx
│   ├── components
│   ├── contexts
│   ├── data
│   ├── index.css
│   ├── layouts
│   ├── main.tsx
│   ├── pages
│   ├── setup.unit.ts
│   ├── types
│   ├── utils
│   └── vite-env.d.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Task

### Testing Plan for Events SPA

You will implement comprehensive testing coverage using the pre-configured Vitest setup with two distinct test projects:

- **Unit Tests**: Testing individual components, functions, and utilities in isolation
- **Integration Tests**: Testing component interactions, data flow, and user workflows

#### Test Configuration

- **Unit Tests**: Run with `npm run test:unit`
  - Located in `src/**/*.unit.test.ts(x)`
  - Environment: `jsdom`
  - Setup file: `src/setup.unit.ts`
- **Integration Tests**: Run with `npm run test:integration`
  - Located in `src/__tests__/integration/**/*.int.test.ts(x)`
  - Environment: `jsdom`
  - Setup file: `src/__tests__/integration/setup.integration.ts`

---

### Unit Testing Plan

#### 1. **Type Guards and Utilities** (`src/types/index.ts`)

**Test File**: `src/utils/typeGuards.unit.test.ts`

- ✅ `isErrorResult()` function with various input types
- ✅ `isSuccessResult()` function with various input types
- ✅ Edge cases: null, undefined, malformed objects

#### 2. **Data Layer Functions** (`src/data/`)

**Test File**: `src/data/events.unit.test.ts`

- ✅ `getAllEvents` loader function
- ✅ URL parameter parsing (page, limit)
- ✅ API error handling
- ✅ Response data transformation
- ✅ Environment variable validation

**Test File**: `src/data/homepage.unit.test.ts`

- ✅ `getHomePageData` loader function
- ✅ Error handling for API failures

#### 2. **Action Functions** (`src/actions/`)

**Test File**: `src/actions/auth.unit.test.ts`

- ✅ `loginAction` with valid credentials
- ✅ `registerAction` with valid data
- ✅ Form data extraction and validation
- ✅ Zod schema validation errors
- ✅ API error responses
- ✅ Successful authentication flow
- ✅ Redirect behavior

**Test File**: `src/actions/events.unit.test.ts`

- ✅ `createEventAction` with valid event data
- ✅ Form validation (title, description, location, coordinates)
- ✅ Authentication header inclusion
- ✅ Error handling for unauthorized requests

#### 3. **UI Components** (`src/components/`)

**Test File**: `src/components/ui/ErrorBoundary.unit.test.tsx`

- ✅ Renders children when no error
- ✅ Catches and displays JavaScript errors
- ✅ Error message formatting
- ✅ Reset functionality

**Test File**: `src/components/ui/Loading.unit.test.tsx`

- ✅ Renders loading spinner
- ✅ Accessibility attributes
- ✅ CSS classes applied correctly

**Test File**: `src/components/ui/NavBar.unit.test.tsx`

- ✅ Renders navigation links
- ✅ Authentication-dependent menu items
- ✅ Active link highlighting
- ✅ Mobile menu toggle

**Test File**: `src/components/events/CreateEventModal.unit.test.tsx`

- ✅ Modal open/close functionality
- ✅ Form field rendering
- ✅ Form validation display
- ✅ Success/error message handling
- ✅ Form reset on successful submission

#### 4. **Layout Components** (`src/layouts/`)

**Test File**: `src/layouts/ProtectedLayout.unit.test.tsx`

- ✅ Redirects unauthenticated users
- ✅ Renders content for authenticated users
- ✅ Loading state handling

---

### Integration Testing Plan

#### 1. **Authentication Flow**

**Test File**: `src/__tests__/integration/auth.int.test.tsx`

- 🔄 Complete login workflow (form → API → context update → redirect)
- 🔄 Complete registration workflow
- 🔄 Logout workflow (state clearing → redirect)
- 🔄 Protected route access control
- 🔄 Auto-login on page refresh
- 🔄 Token expiration handling
- 🔄 **AuthProvider context behavior** (state management, localStorage persistence)

#### 2. **Events Management**

**Test File**: `src/__tests__/integration/events.int.test.tsx`

- 🔄 Events page loading with API data
- 🔄 Infinite scroll pagination
- 🔄 Map and list view synchronization
- 🔄 Event creation workflow (modal → form → API → refresh)
- 🔄 Event highlighting between map and list
- 🔄 Error handling for failed API calls

#### 3. **Navigation and Routing**

**Test File**: `src/__tests__/integration/routing.int.test.tsx`

- 🔄 Route transitions between pages
- 🔄 Protected route redirects
- 🔄 404 page for invalid routes
- 🔄 Browser back/forward navigation
- 🔄 URL parameter preservation

#### 4. **Map Interactions**

**Test File**: `src/__tests__/integration/map.int.test.tsx`

- 🔄 Map loading and rendering with MapContainer
- 🔄 Custom map components (`EventsMarkers`, `MapBounds`, `PanOnHover`) within map context
- 🔄 Event markers placement and click interactions
- 🔄 Map bounds adjustment based on events data
- 🔄 Pan behavior on event hover from EventsList
- 🔄 Map and events list coordination and synchronization

#### 5. **Form Workflows**

**Test File**: `src/__tests__/integration/forms.int.test.tsx`

- 🔄 Login form validation and submission
- 🔄 Registration form validation and submission
- 🔄 Create event form with map coordinate selection
- 🔄 Error display and form state management
- 🔄 Success feedback and page transitions

#### 6. **Error Handling**

**Test File**: `src/__tests__/integration/errorHandling.int.test.tsx`

- 🔄 Network error scenarios
- 🔄 API error responses
- 🔄 Error boundary activation
- 🔄 Graceful degradation
- 🔄 User feedback for errors

#### 7. **Map Components** (`src/components/map/`)

> **Note**: These components use React Leaflet's `useMap` hook and interact with the Leaflet map instance. While they don't test the actual Leaflet library, they should be tested in **integration tests** due to their dependency on the map context and complex interactions.

**Test File**: `src/__tests__/integration/mapComponents.int.test.tsx`

- 🔄 `EventsMarkers` - Renders markers for provided events within map context
- 🔄 `EventsList` - Renders list and coordinates with map interactions
- 🔄 `MapBounds` - Adjusts map bounds based on events data
- 🔄 `PanOnHover` - Map panning behavior on event hover

---

#### Running Tests

```bash
# Run all tests in watch mode
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in a single run
npm test -- --run
```

---

### Implementation Priority

**Phase 1 - Core Functionality (High Priority)**

1. Type guards and utility functions
2. Data loading functions
3. Action functions (auth, events)
4. Basic UI components (ErrorBoundary, Loading, NavBar)

**Phase 2 - Feature Testing (Medium Priority)**

1. Event management workflows (CreateEventModal)
2. Form validations and submissions
3. Layout components (ProtectedLayout)
4. Error boundary and error handling

**Phase 3 - Integration Flows (High Priority)**

1. Authentication workflows and AuthProvider context
2. Events management workflows
3. Navigation and routing
4. Map interactions and custom map components

**Phase 4 - Advanced Scenarios (Lower Priority)**

1. Edge case handling
2. Performance testing
3. Accessibility testing
4. Error recovery scenarios
