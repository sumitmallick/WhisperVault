const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Token management
const TOKEN_KEY = 'auth_token';

export const tokenManager = {
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },
  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
};

async function fetchApi(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[API] ${options.method || 'GET'} ${url}`); // Log all API calls

  // Get stored token and add to headers if available
  const token = tokenManager.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    console.log(`[API] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API] Error response:', errorData);
      throw new Error(errorData.detail || 'Something went wrong');
    }

    // Handle empty responses
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    console.log('[API] Response data:', data); // Log response data
    return data;
  } catch (error) {
    console.error('[API] Request failed:', error);
    throw error;
  }
}

export const authApi = {
  async signIn(credentials: { email: string; password: string }) {
    // Use form data for OAuth2PasswordRequestForm
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    
    const tokenResponse = await fetch(`${API_BASE_URL}/auth/token`, {
      method: 'POST',
      body: formData,
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed');
    }
    
    const { access_token } = await tokenResponse.json();
    
    // Store the token
    tokenManager.setToken(access_token);
    
    // Get user data
    const user = await fetchApi('/users/me');
    return user;
  },
  async signUp(userData: { name: string; email: string; password: string }) {
    return fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  async getCurrentUser() {
    try {
      const user = await fetchApi('/users/me');
      console.log('[Auth] Current user:', user);
      return user;
    } catch (error: any) {
      console.log('[Auth] No user session');
      // If token is invalid, remove it
      if (error.message?.includes('401') || error.message?.includes('403')) {
        tokenManager.removeToken();
      }
      return null;
    }
  },
  async signOut() {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (error) {
      // Even if logout fails on server, remove token locally
      console.error('Logout error:', error);
    } finally {
      tokenManager.removeToken();
    }
  },
};

export const confessionsApi = {
  async create(confession: { gender: string; age: number; content: string; language?: string; anonymous?: boolean }) {
    return fetchApi('/confessions', {
      method: 'POST',
      body: JSON.stringify(confession),
    });
  },
  async getAll(limit = 20) {
    return fetchApi(`/confessions?limit=${limit}`);
  },
  async getById(id: string) {
    return fetchApi(`/confessions/${id}`);
  },
  async getMyConfessions(page = 1, perPage = 10) {
    return fetchApi(`/confessions/my-confessions?page=${page}&per_page=${perPage}`);
  },
  async generateImage(confessionId: number, platforms: string[], theme = 'dark') {
    return fetchApi(`/confessions/${confessionId}/generate-image`, {
      method: 'POST',
      body: JSON.stringify({ platforms, theme }),
    });
  },
  async postToSocial(confessionId: number, platforms: string[], generateImages = true, theme = 'dark', delayMinutes = 0) {
    return fetchApi(`/confessions/${confessionId}/post-to-social`, {
      method: 'POST',
      body: JSON.stringify({
        platforms,
        generate_images: generateImages,
        theme,
        delay_minutes: delayMinutes
      }),
    });
  }
};
