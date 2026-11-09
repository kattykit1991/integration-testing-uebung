// Auth Context
export type AuthUser = {
  id: number;
  email: string;
  name: string;
};

export type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
};

// API (Data Loading)
type PaginatedResponse<T> = {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  results: T[];
};

export type User = {
  id: number;
  name: string | null;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Event = {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  latitude: number;
  longitude: number;
  organizerId: number;
  createdAt: string;
  updatedAt: string;
};

export type UsersResponse = PaginatedResponse<User>;
export type EventsResponse = PaginatedResponse<Event>;

// API (Mutations)
export type ActionError = {
  error: string;
};

export type ActionSuccess<T = unknown> = {
  success: true;
} & T;

export type AuthSuccessResult = ActionSuccess<{
  user: AuthUser;
  token: string;
}>;

export type CreateEventSuccessResult = ActionSuccess<{
  message: string;
}>;

export type AuthActionResult = AuthSuccessResult | ActionError | Response | undefined;
export type CreateActionResult = CreateEventSuccessResult | ActionError | Response | undefined;

export const isErrorResult = (data: AuthActionResult | CreateActionResult): data is ActionError => {
  return typeof data === 'object' && data !== null && 'error' in data;
};

export const isSuccessResult = (
  data: AuthActionResult | CreateActionResult
): data is AuthSuccessResult => {
  return typeof data === 'object' && data !== null && 'success' in data && data.success === true;
};

// A bit more refined
/* 
export const isErrorResult = <T extends { error?: unknown }>(
  data: unknown
): data is Extract<T, { error: string }> => {
  return typeof data === 'object' && data !== null && 'error' in data;
};

export const isSuccessResult = <T extends { success?: boolean }>(
  data: unknown
): data is Extract<T, { success: true }> => {
  return typeof data === 'object' && data !== null && 'success' in data && data.success === true;
};
*/
