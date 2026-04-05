import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../lib/api';

interface User { id: string; email: string; name: string; role: string; plan: string; avatarUrl?: string; }
interface AuthCtx { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<any>; register: (data: any) => Promise<any>; logout: () => Promise<void>; refresh: () => Promise<void>; }

const AuthContext = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.post('/auth/refresh');
      if (data.data?.accessToken) {
        api.defaults.headers.common.Authorization = `Bearer ${data.data.accessToken}`;
        const me = await api.get('/users/me');
        setUser(me.data.data);
      }
    } catch { setUser(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.data?.accessToken) {
      api.defaults.headers.common.Authorization = `Bearer ${data.data.accessToken}`;
      const me = await api.get('/users/me');
      setUser(me.data.data);
    }
    return data.data;
  };

  const register = async (formData: any) => {
    const { data } = await api.post('/auth/register', formData);
    if (data.data?.accessToken) {
      api.defaults.headers.common.Authorization = `Bearer ${data.data.accessToken}`;
      const me = await api.get('/users/me');
      setUser(me.data.data);
    }
    return data.data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</AuthContext.Provider>;
}
