import * as Storage from '../utils/storage';
import { baseURI } from '../utils/constant';

const API_URL = process.env.EXPO_PUBLIC_API_URL || baseURI;

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = await Storage.getItemAsync('accessToken');
  
  // Combine base URL if relative
  let finalUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  
  if (token) {
    // API supports token via query param
    // We add the token to the URL query string
    try {
      const urlObj = new URL(finalUrl);
      urlObj.searchParams.append('token', token);
      finalUrl = urlObj.toString();
    } catch (e) {
      // Fallback for simple paths if URL parsing fails in older environments
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token);
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(finalUrl, {
    credentials: 'include',
    ...options,
    headers,
  });

  // Simple cookie extraction interceptor to store access token fallback
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    const cookies = setCookieHeader.split(',');
    for (const c of cookies) {
      if (c.trim().startsWith('accessToken=')) {
        const tokenStr = c.trim().split(';')[0].substring('accessToken='.length);
        await Storage.setItemAsync('accessToken', tokenStr);
      }
    }
  }

  if (!response.ok) {
    // Try to parse JSON error message
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) {
      // Not JSON
    }
    // Match Axios error structure for compatibility with existing code
    throw { response: { data: errorData } };
  }

  // Try to parse JSON response
  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    // Empty response or non-JSON
  }

  return { data }; // Match Axios response structure
};

const api = {
  get: (url: string, options?: RequestInit) => fetchWithAuth(url, { ...options, method: 'GET' }),
  post: (url: string, body?: any, options?: RequestInit) => {
    return fetchWithAuth(url, { 
      ...options, 
      method: 'POST', 
      body: body ? JSON.stringify(body) : undefined 
    });
  },
};

export default api;
