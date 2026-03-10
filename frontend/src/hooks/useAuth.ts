import { useEffect, useState } from 'react';

const TOKEN_KEY = 'arcade_vendor_token';

export function useAuth() {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  );

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  const login = (newToken: string) => setToken(newToken);
  const logout = () => setToken(null);

  return {
    token,
    isAuthenticated: Boolean(token),
    login,
    logout,
  };
}

