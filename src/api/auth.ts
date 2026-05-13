import { API_BASE_URL } from './config';

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    profilePicture?: string;
  };
}

export const authApi = {
  register: async (data: any): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Registration failed');
    return result;
  },

  login: async (data: any): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Login failed');
    return result;
  },

  getMe: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to fetch user');
    return result;
  },
};
