import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, HelperProfile, CustomerProfile, AdminProfile, mockHelpers } from '@/app/data/mockData';
import { isBackendConfigured } from '@/app/config/appConfig';
import { apiRequest } from '@/app/services/apiClient';
import { saveHelperApplication } from '@/app/utils/helperApplicationStorage';
import { localApi } from '@/app/utils/localApi';

type RegisterInput = Partial<User | HelperProfile | CustomerProfile> & { password?: string };

interface AuthContextType {
  user: User | HelperProfile | CustomerProfile | AdminProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoHelper: () => Promise<void>;
  loginAsDemoAdmin: () => Promise<void>;
  logout: () => void;
  register: (userData: RegisterInput) => Promise<void>;
  updateUser: (userData: Partial<User | HelperProfile | CustomerProfile | AdminProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'hometask_user';
const LEGACY_STORAGE_KEY = 'homecare_user';
const ACCESS_TOKEN_STORAGE_KEY = 'hometask_access_token';

interface AuthResponse {
  user: User | HelperProfile | CustomerProfile | AdminProfile;
  accessToken?: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | HelperProfile | CustomerProfile | AdminProfile | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!savedUser) {
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedUser));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }, []);

  const loginWithGoogle = async () => {
    // Mock Google OAuth login
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockUser: CustomerProfile = {
      id: 'user_' + Date.now(),
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      userType: 'customer',
      phone: '0912345678',
      address: 'Quận Hải Châu, Đà Nẵng',
      createdAt: new Date().toISOString(),
      preferences: [],
      favoriteHelpers: []
    };

    setUser(mockUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
  };

  const login = async (email: string, password?: string) => {
    // Mock login
    await new Promise(resolve => setTimeout(resolve, 800));

    const normalizedEmail = email.trim();
    if (isBackendConfigured) {
      const response = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      setUser(response.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response.user));
      if (response.accessToken) {
        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, response.accessToken);
      }
      return;
    }

    const mockUser: CustomerProfile = {
      id: 'user_' + Date.now(),
      name: normalizedEmail.split('@')[0] || 'Khách hàng',
      email: normalizedEmail,
      userType: 'customer',
      createdAt: new Date().toISOString(),
      preferences: [],
      favoriteHelpers: []
    };

    setUser(mockUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
  };

  const loginAsDemoHelper = async () => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const demoHelper: HelperProfile = {
      ...mockHelpers[0],
      email: 'helper.demo@hometask.vn',
    };

    setUser(demoHelper);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoHelper));
  };

  const loginAsDemoAdmin = async () => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const demoAdmin: AdminProfile = {
      id: 'admin_demo',
      name: 'Quản trị HomeTask',
      email: 'admin@hometask.vn',
      userType: 'admin',
      role: 'operations',
      createdAt: new Date().toISOString(),
    };

    setUser(demoAdmin);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoAdmin));
  };

  const register = async (userData: RegisterInput) => {
    // Mock registration
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isBackendConfigured) {
      const response = await apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      setUser(response.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response.user));
      if (response.accessToken) {
        localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, response.accessToken);
      }
      return;
    }

    const newUser = {
      id: 'user_' + Date.now(),
      createdAt: new Date().toISOString(),
      ...userData
    } as User | HelperProfile | CustomerProfile;

    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    if (newUser.userType === 'helper') {
      saveHelperApplication(newUser as HelperProfile);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  };

  const updateUser = async (userData: Partial<User | HelperProfile | CustomerProfile | AdminProfile>) => {
    if (!user) {
      return;
    }

    const nextUser = {
      ...user,
      ...userData,
    } as User | HelperProfile | CustomerProfile | AdminProfile;

    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));

    if (nextUser.userType === 'helper') {
      if (isBackendConfigured) {
        const updatedUser = await localApi.helpers.updateMe(userData as Partial<HelperProfile>);
        setUser(updatedUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      } else {
        saveHelperApplication(nextUser as HelperProfile);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        loginAsDemoHelper,
        loginAsDemoAdmin,
        logout,
        register,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
