/**
 * Integration tests for the authentication flow.
 *
 * A unit test checks one piece on its own. These tests check that several real pieces
 * work together: the Login and Register pages, their form actions, the AuthProvider,
 * the ProtectedLayout and the router.
 *
 * The only thing we fake is the backend. Every request the app makes goes through the
 * global `fetch` function, so we put a spy on `fetch` and decide in each test what the
 * "server" answers. Everything else in these tests is the real app code.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AuthProvider, useAuth } from '@/contexts';
import { MainLayout, ProtectedLayout } from '@/layouts';
import { CreateEvent, Login, Register } from '@/pages';
import { getAllEvents } from '@/data';
import { loginAction, registerAction } from '@/actions';

// ---------------------------------------------------------------------------
// Fake data that our fake server sends back
// ---------------------------------------------------------------------------

// The user the server knows about.
const ada = { id: 1, email: 'ada@example.com', name: 'Ada' };

// The /app page loads events. We send back an empty list, because the events
// themselves don't matter for authentication.
const noEvents = {
  totalCount: 0,
  totalPages: 0,
  currentPage: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  results: []
};

// ---------------------------------------------------------------------------
// Rendering the app
// ---------------------------------------------------------------------------

/**
 * Renders the app, starting at the given URL path.
 *
 * App.tsx uses a browser router, which always starts at the browser's current URL.
 * In tests we want to choose where we start, so we build the same routes with a
 * memory router instead. We only include the routes that matter for authentication.
 *
 * The function returns the router, so a test can check which path we ended up on.
 */
const renderApp = (startPath: string) => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <MainLayout />,
        children: [
          { path: 'login', element: <Login />, action: loginAction },
          { path: 'register', element: <Register />, action: registerAction },
          {
            path: 'app',
            element: <ProtectedLayout />,
            children: [{ index: true, element: <CreateEvent />, loader: getAllEvents }]
          }
        ]
      }
    ],
    { initialEntries: [startPath] }
  );

  // Just like in main.tsx, the AuthProvider wraps the whole router.
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );

  return router;
};

// ---------------------------------------------------------------------------
// Before and after every test
// ---------------------------------------------------------------------------

beforeEach(() => {
  // The AuthProvider reads the token from localStorage.
  // Start every test with an empty storage, so no test depends on another one.
  localStorage.clear();
});

afterEach(() => {
  // Remove all spies, so the real `fetch` and `console.error` come back.
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// The tests
// ---------------------------------------------------------------------------

describe('Authentication flow', () => {
  describe('Login', () => {
    it('logs the user in and redirects to /app', async () => {
      // Arrange: the fake server accepts the login and knows the user.
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        // Response.json() builds a real fetch Response, like a server would send.
        const address = String(url);
        if (address.endsWith('/auth/login')) {
          return Response.json({ user: ada, token: 'valid-token' });
        }
        if (address.endsWith('/auth/profile')) {
          return Response.json(ada);
        }
        if (address.includes('/events')) {
          return Response.json(noEvents);
        }
        throw new Error(`The test did not expect a request to ${address}`);
      });

      const router = renderApp('/login');

      // Act: fill in the form and submit it.
      fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
        target: { value: 'ada@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      // Assert: we land on the protected page and see the user's name.
      // findByText waits, because the requests and the redirect take a moment.
      expect(await screen.findByText('Welcome back, Ada!')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/app');

      // The login action sent the form data to the server.
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'ada@example.com', password: 'password123' })
        })
      );

      // The AuthProvider saved the session, so it survives a page refresh.
      expect(localStorage.getItem('token')).toBe('valid-token');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(ada));

      // The navigation now offers "Log out".
      // NavBar and SideBar both render it, so we use getAllByText.
      expect(screen.getAllByText('Log out')).not.toHaveLength(0);
    });

    it('shows the error from the server when the password is wrong', async () => {
      // Arrange: the fake server rejects the login.
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const address = String(url);
        if (address.endsWith('/auth/login')) {
          return Response.json({ error: 'Invalid credentials' }, { status: 401 });
        }
        throw new Error(`The test did not expect a request to ${address}`);
      });

      const router = renderApp('/login');

      // Act
      fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
        target: { value: 'ada@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'wrongpassword' }
      });
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      // Assert: the error is shown, we stay on /login and nothing is saved.
      expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/login');
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('shows a validation error and does not call the server for an invalid email', async () => {
      // Arrange: we still spy on fetch, but only to check that it is NOT called.
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      renderApp('/login');

      // Act
      fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
        target: { value: 'not-an-email' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      // Assert: the zod schema in loginAction stopped the request.
      // We use a regular expression, because the message contains more text around it.
      expect(await screen.findByText(/Invalid email address/)).toBeInTheDocument();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('Registration', () => {
    it('creates the account and redirects to /login', async () => {
      // Arrange: the fake server accepts the new user.
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const address = String(url);
        if (address.endsWith('/users')) {
          return Response.json({ id: 2 }, { status: 201 });
        }
        throw new Error(`The test did not expect a request to ${address}`);
      });

      const router = renderApp('/register');

      // Act
      fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
        target: { value: 'Grace' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
        target: { value: 'grace@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

      // Assert: we are sent to the login page.
      expect(await screen.findByText('Sign in to your account')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/login');

      // The register action sent the form data to the server.
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Grace',
            email: 'grace@example.com',
            password: 'password123'
          })
        })
      );

      // Registering does not log the user in. They still have to sign in.
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('shows the error from the server when the email is already taken', async () => {
      // Arrange: the fake server rejects the new user.
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const address = String(url);
        if (address.endsWith('/users')) {
          return Response.json({ error: 'Email already in use' }, { status: 409 });
        }
        throw new Error(`The test did not expect a request to ${address}`);
      });

      const router = renderApp('/register');

      // Act
      fireEvent.change(screen.getByPlaceholderText('Enter your name'), {
        target: { value: 'Ada' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
        target: { value: 'ada@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

      // Assert: the error is shown and we stay on /register.
      expect(await screen.findByText('Email already in use')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/register');
    });
  });

  describe('Logout', () => {
    it('clears the session and redirects from the protected page to /login', async () => {
      // Arrange: the user is already logged in (a token is stored) ...
      localStorage.setItem('token', 'valid-token');

      // ... and the fake server accepts that token.
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const address = String(url);
        if (address.endsWith('/auth/profile')) {
          return Response.json(ada);
        }
        if (address.includes('/events')) {
          return Response.json(noEvents);
        }
        throw new Error(`The test did not expect a request to ${address}`);
      });

      const router = renderApp('/app');

      // Wait until the protected page is shown, so we know the user is logged in.
      await screen.findByText('Welcome back, Ada!');

      // Act: click "Log out". NavBar and SideBar both have one, we take the first.
      fireEvent.click(screen.getAllByText('Log out')[0]);

      // Assert: ProtectedLayout sends us to /login ...
      expect(await screen.findByText('Sign in to your account')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/login');

      // ... the session is removed from localStorage ...
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();

      // ... and the navigation no longer offers "Log out".
      expect(screen.queryByText('Log out')).not.toBeInTheDocument();
    });
  });

  describe('Protected route access control', () => {
    it('redirects a visitor without a token from /app to /login', async () => {
      // Arrange: no token in localStorage (beforeEach cleared it).
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const address = String(url);
        // The /app route loads events before it checks the login, so this request still happens.
        if (address.includes('/events')) {
          return Response.json(noEvents);
        }
        throw new Error(`The test did not expect a request to ${address}`);
      });

      // Act: try to open the protected page directly.
      const router = renderApp('/app');

      // Assert: we are sent to the login page.
      expect(await screen.findByText('Sign in to your account')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/login');

      // Without a token, the AuthProvider has nothing to check with the server.
      expect(fetchSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('/auth/profile'),
        expect.anything()
      );
    });

    it('redirects a logged-in user away from /register to /app', async () => {
      // Arrange: the user is already logged in.
      localStorage.setItem('token', 'valid-token');

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const address = String(url);
        if (address.endsWith('/auth/profile')) {
          return Response.json(ada);
        }
        if (address.includes('/events')) {
          return Response.json(noEvents);
        }
        throw new Error(`The test did not expect a request to ${address}`);
      });

      // Act: open the register page.
      const router = renderApp('/register');

      // Assert: a logged-in user has no reason to register, so we land on /app.
      expect(await screen.findByText('Welcome back, Ada!')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/app');
    });

    it('shows a loading spinner while it checks the stored token', async () => {
      // Arrange: the user has a token, but the server has not answered yet.
      localStorage.setItem('token', 'valid-token');

      // We keep the profile request "open" and answer it ourselves later.
      // `answerProfileRequest` is the resolve function of that open promise.
      let answerProfileRequest: (response: Response) => void = () => {};

      vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
        const address = String(url);
        if (address.endsWith('/auth/profile')) {
          return new Promise((resolve) => {
            answerProfileRequest = resolve;
          });
        }
        if (address.includes('/events')) {
          return Promise.resolve(Response.json(noEvents));
        }
        throw new Error(`The test did not expect a request to ${address}`);
      });

      renderApp('/app');

      // Assert (1): while we wait for the server, ProtectedLayout shows the spinner.
      // The spinner has no text, so we look for its CSS class.
      expect(await screen.findByText('Venued')).toBeInTheDocument(); // the layout has rendered
      expect(document.querySelector('.loading')).toBeInTheDocument();
      expect(screen.queryByText('Welcome back, Ada!')).not.toBeInTheDocument();

      // Act: now the server answers.
      answerProfileRequest(Response.json(ada));

      // Assert (2): the spinner is replaced by the protected page.
      expect(await screen.findByText('Welcome back, Ada!')).toBeInTheDocument();
      expect(document.querySelector('.loading')).not.toBeInTheDocument();
    });
  });

  describe('Auto-login on page refresh', () => {
    it('logs the user back in with the token from localStorage', async () => {
      // Arrange: a token is left over from an earlier visit.
      // This is what localStorage looks like after a page refresh.
      localStorage.setItem('token', 'valid-token');

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const address = String(url);
        if (address.endsWith('/auth/profile')) {
          return Response.json(ada);
        }
        if (address.includes('/events')) {
          return Response.json(noEvents);
        }
        throw new Error(`The test did not expect a request to ${address}`);
      });

      // Act: open the protected page, like a refresh of /app would.
      const router = renderApp('/app');

      // Assert: the user is logged in without filling in any form.
      expect(await screen.findByText('Welcome back, Ada!')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/app');

      // The AuthProvider sent the stored token to the server to get the profile.
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/auth/profile'), {
        headers: { Authorization: 'Bearer valid-token' }
      });

      // It saved the profile it got back.
      expect(localStorage.getItem('user')).toBe(JSON.stringify(ada));
    });
  });

  describe('Token expiration', () => {
    it('removes an expired token and redirects to /login', async () => {
      // Arrange: an old session is stored ...
      localStorage.setItem('token', 'expired-token');
      localStorage.setItem('user', JSON.stringify(ada));

      // ... but the server says the token is no longer valid.
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const address = String(url);
        if (address.endsWith('/auth/profile')) {
          return Response.json({ message: 'Token expired' }, { status: 401 });
        }
        if (address.includes('/events')) {
          return Response.json(noEvents);
        }
        throw new Error(`The test did not expect a request to ${address}`);
      });

      // Act
      const router = renderApp('/app');

      // Assert: we are sent to the login page ...
      expect(await screen.findByText('Sign in to your account')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/login');

      // ... and the old session is removed.
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('AuthProvider context', () => {
    /**
     * A tiny component that only shows what useAuth() returns.
     * It lets us look at the context values directly, without any page around them.
     */
    const ShowAuthState = () => {
      const { loading, isAuthenticated, user, token } = useAuth();
      return (
        <ul>
          <li>loading: {String(loading)}</li>
          <li>isAuthenticated: {String(isAuthenticated)}</li>
          <li>user: {user ? user.name : 'none'}</li>
          <li>token: {token ?? 'none'}</li>
        </ul>
      );
    };

    it('starts with loading: true and fills in the user once the server answers', async () => {
      // Arrange: a token is stored, and we answer the profile request ourselves (see above).
      localStorage.setItem('token', 'valid-token');

      let answerProfileRequest: (response: Response) => void = () => {};
      vi.spyOn(globalThis, 'fetch').mockImplementation(
        () =>
          new Promise((resolve) => {
            answerProfileRequest = resolve;
          })
      );

      // Act
      render(
        <AuthProvider>
          <ShowAuthState />
        </AuthProvider>
      );

      // Assert (1): the token is read from localStorage right away,
      // but the user is not known until the server answers.
      expect(screen.getByText('loading: true')).toBeInTheDocument();
      expect(screen.getByText('isAuthenticated: false')).toBeInTheDocument();
      expect(screen.getByText('user: none')).toBeInTheDocument();
      expect(screen.getByText('token: valid-token')).toBeInTheDocument();

      // Act: the server answers.
      answerProfileRequest(Response.json(ada));

      // Assert (2): now the user is logged in.
      expect(await screen.findByText('loading: false')).toBeInTheDocument();
      expect(screen.getByText('isAuthenticated: true')).toBeInTheDocument();
      expect(screen.getByText('user: Ada')).toBeInTheDocument();
    });

    it('finishes loading as logged out when there is no token', async () => {
      // Arrange: no token in localStorage.
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      // Act
      render(
        <AuthProvider>
          <ShowAuthState />
        </AuthProvider>
      );

      // Assert: loading ends, nobody is logged in, and the server was never asked.
      expect(await screen.findByText('loading: false')).toBeInTheDocument();
      expect(screen.getByText('isAuthenticated: false')).toBeInTheDocument();
      expect(screen.getByText('token: none')).toBeInTheDocument();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('throws an error when useAuth is used outside of the AuthProvider', () => {
      // When a component throws, React logs the error with console.error.
      // We replace console.error with a spy that does nothing, to keep the test output clean.
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act + Assert: rendering without the provider throws our error message.
      expect(() => render(<ShowAuthState />)).toThrow(
        'useAuth must be used within an AuthProvider'
      );
    });
  });
});
