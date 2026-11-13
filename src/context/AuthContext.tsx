import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/auth';
import { dbService } from '../services/database';
import type { UserProfile, RegisterData, RotationPlan, FarmAssessmentInput, NasaPowerClimateData, SoilData } from '../types';

interface PendingSavePlanData {
  plan: RotationPlan;
  input: FarmAssessmentInput;
  climate: NasaPowerClimateData;
  soil: SoilData;
  farmName?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<{ requiresVerification: boolean }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  
  // Guest to Auth Bridge & Modal Controls
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register', pendingPlan?: PendingSavePlanData) => void;
  closeAuthModal: () => void;
  pendingSavePlan: PendingSavePlanData | null;
  clearPendingSavePlan: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [pendingSavePlan, setPendingSavePlan] = useState<PendingSavePlanData | null>(null);

  useEffect(() => {
    let isMounted = true;
    authService.restoreSession()
      .then(restored => {
        if (isMounted) {
          setUser(restored);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.warn('[AuthContext] Session restore notice:', err);
        if (isMounted) setIsLoading(false);
      });

    const unsubscribe = authService.onAuthStateChange(updatedUser => {
      if (isMounted) {
        setUser(updatedUser);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, rememberMe = true) => {
    const loggedUser = await authService.login(email, password, rememberMe);
    setUser(loggedUser);
  };

  const register = async (data: RegisterData) => {
    const res = await authService.register(data);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('Not authenticated');
    const updated = await dbService.updateProfile(user.id, updates);
    setUser(updated);
  };

  const deleteAccount = async () => {
    if (!user) throw new Error('Not authenticated');
    await dbService.deleteAccount(user.id);
    await logout();
  };

  const requestPasswordReset = async (email: string) => {
    return authService.requestPasswordReset(email);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login', pendingPlan?: PendingSavePlanData) => {
    setAuthModalMode(mode);
    if (pendingPlan) {
      setPendingSavePlan(pendingPlan);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const clearPendingSavePlan = () => {
    setPendingSavePlan(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        deleteAccount,
        requestPasswordReset,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        pendingSavePlan,
        clearPendingSavePlan
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
