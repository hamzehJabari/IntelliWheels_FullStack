import { API_BASE_URL } from './config';
import {
// REMOVED: import { MOCK_CARS } from './mockData' - no synthetic data fallbacks
  AnalyticsInsights,
  Car,
  CarFilters,
  DealerDetail,
  DealerSummary,
  ListingDraft,
  PriceEstimatePayload,
  PriceEstimateResponse,
  SemanticSearchResult,
  UserProfile,
  VisionAttributes,
} from './types';

interface RequestOptions<TResponse = any> {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  token?: string | null;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  isFormData?: boolean;
  fallback?: () => TResponse | Promise<TResponse>;
}

async function apiRequest<T = any>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  const {
    method = 'GET',
    token,
    body,
    headers,
    signal,
    isFormData,
    fallback,
  } = options;

  const finalHeaders = new Headers(headers ?? {});
  if (!isFormData) {
    finalHeaders.set('Content-Type', 'application/json');
  }
  if (token) {
    finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      signal,
      cache: 'no-store',
      body:
        method === 'GET'
          ? undefined
          : isFormData
          ? (body as BodyInit)
          : body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  } catch (error) {
    // Silently handle aborted requests (e.g., component unmount)
    const isAbort = error instanceof DOMException && error.name === 'AbortError';
    if (fallback) {
      if (!isAbort) {
        console.warn(`[api] Falling back for ${path}:`, error);
      }
      return await fallback();
    }
    if (isAbort) {
      throw error; // Re-throw abort without wrapping
    }
    throw error instanceof Error ? error : new Error('Network request failed');
  }

  let data: T | null = null;
  try {
    data = (await response.json()) as T;
  } catch (error) {
    // Some endpoints may return 204 or non-JSON payloads
    data = null;
  }

  if (!response.ok) {
    const message = (data as any)?.error || response.statusText || 'Request failed';
    throw new Error(message);
  }

  return data as T;
}

export async function fetchCars(filters: CarFilters, signal?: AbortSignal, token?: string | null) {
  const params = new URLSearchParams();
  if (filters.make && filters.make !== 'all') params.append('make', filters.make);
  if (filters.search) params.append('search', filters.search);
  if (filters.sort && filters.sort !== 'default') params.append('sort', filters.sort);

  // No fallback - frontend depends on backend API for real car data only
  return apiRequest<{ success: boolean; cars: Car[] }>(`/cars${params.size ? `?${params.toString()}` : ''}`, {
    signal,
    token,
  });
}

export async function fetchCarById(carId: number, token?: string | null) {
  // No fallback - frontend depends on backend API for real car data only
  return apiRequest<{ success: boolean; car: Car }>(`/cars/${carId}`, {
    token,
  });
}

export async function fetchMakes(token?: string | null) {
  // No fallback - frontend depends on backend API for real makes data only
  return apiRequest<{ success: boolean; makes: string[] }>(`/makes`, {
    token,
  });
}

// REMOVED: filterLocalCars, getLocalCarById, getLocalMakes functions
// No synthetic data fallbacks - frontend relies on backend API only

export async function createListing(payload: Partial<Car>, token: string | null) {
  return apiRequest(`/cars`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function updateListing(carId: number, payload: Partial<Car>, token: string | null) {
  return apiRequest(`/cars/${carId}`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}

export async function deleteListing(carId: number, token: string | null) {
  return apiRequest(`/cars/${carId}`, {
    method: 'DELETE',
    token,
  });
}

export async function fetchFavorites(token: string | null) {
  return apiRequest<{ success: boolean; cars: Car[] }>(`/favorites`, { token });
}

export async function addFavorite(carId: number, token: string | null) {
  return apiRequest(`/favorites`, {
    method: 'POST',
    token,
    body: { car_id: carId },
  });
}

export async function removeFavorite(carId: number, token: string | null) {
  return apiRequest(`/favorites/${carId}`, {
    method: 'DELETE',
    token,
  });
}

export async function fetchMyListings(token: string | null) {
  return apiRequest<{ success: boolean; cars: Car[] }>(`/my-listings`, { token });
}

export async function signupUser(username: string, email: string, password: string) {
  return apiRequest<{ success: boolean; token: string; user: UserProfile; error?: string }>(`/auth/signup`, {
    method: 'POST',
    body: { username, email, password },
  });
}

export async function loginUser(username: string, password: string) {
  return apiRequest<{ success: boolean; token: string; user: UserProfile; error?: string }>(`/auth/login`, {
    method: 'POST',
    body: { username, password },
  });
}

export async function verifySession(token: string | null) {
  if (!token) {
    return { success: false, authenticated: false };
  }
  return apiRequest<{ success: boolean; authenticated: boolean; user?: UserProfile }>(`/auth/verify`, {
    token,
    fallback: async () => ({ success: true, authenticated: true }),
  });
}

export async function logoutUser(token: string | null) {
  if (!token) return { success: true };
  return apiRequest(`/auth/logout`, {
    method: 'POST',
    token,
    body: { token },
  });
}

export async function getProfile(token: string | null) {
  return apiRequest<{ success: boolean; user: UserProfile }>(`/profile`, { token });
}

export async function updateProfile(payload: Partial<UserProfile> & { password?: string; current_password?: string }, token: string | null) {
  return apiRequest(`/profile`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}

export async function getAnalytics(filter: 'all' | 'my' | 'favorites', token: string | null) {
  const params = new URLSearchParams();
  if (filter && filter !== 'all') params.append('filter', filter);
  return apiRequest<{ success: boolean; insights: AnalyticsInsights; filter: string; user_stats?: Record<string, unknown> }>(
    `/analytics/insights${params.size ? `?${params.toString()}` : ''}`,
    { token }
  );
}

export async function fetchDealers(token: string | null) {
  return apiRequest<{ success: boolean; dealers: DealerSummary[] }>(`/dealers`, {
    token,
  });
}

export async function fetchDealerById(dealerId: number, token: string | null) {
  return apiRequest<{ success: boolean; dealer: DealerDetail }>(`/dealers/${dealerId}`, {
    token,
  });
}

export async function getPriceEstimate(payload: PriceEstimatePayload, token: string | null) {
  return apiRequest<PriceEstimateResponse & { success: boolean }>(`/price-estimate`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function analyzeListingImage(payload: { image_base64: string; mime_type?: string }, token: string | null) {
  return apiRequest<{ success: boolean; attributes: VisionAttributes; raw: string }>(`/vision-helper`, {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function semanticSearch(query: string, limit = 6, token: string | null) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return apiRequest<{ success: boolean; results: SemanticSearchResult[] }>(`/semantic-search?${params.toString()}`, {
    token,
  });
}

export async function uploadListingImage(file: File, token: string | null) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest<{ success: boolean; url: string; path?: string; filename?: string }>(`/uploads/images`, {
    method: 'POST',
    token,
    body: formData,
    isFormData: true,
  });
}

export interface ChatbotPayload {
  query: string;
  history?: Array<{ role: 'user' | 'bot'; text: string }>;
  apiKey?: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export async function handleChatbotMessage(payload: ChatbotPayload, token?: string | null, signal?: AbortSignal) {
  const finalPayload = {
    query: payload.query,
    history: payload.history ?? [],
    image_base64: payload.imageBase64,
    image_mime_type: payload.imageMimeType,
  };

  return apiRequest<{ success: boolean; response: string; message_id?: string; relevant_car_ids?: number[] }>(`/chatbot`, {
    method: 'POST',
    token,
    body: finalPayload,
    signal,
  });
}

export async function handleListingAssistantMessage(
  payload: Omit<ChatbotPayload, 'imageBase64' | 'imageMimeType'>,
  token?: string | null,
  signal?: AbortSignal
) {
  const finalPayload = {
    query: payload.query,
    history: payload.history ?? [],
  };

  return apiRequest<{ success: boolean; response: string; action_type?: string; listing_data?: ListingDraft; message_id?: string }>(
    `/listing-assistant`,
    {
      method: 'POST',
      token,
      body: finalPayload,
      signal,
    }
  );
}

export async function healthCheck() {
  return apiRequest<{ success: boolean; status: string; timestamp: string }>(`/health`);
}
