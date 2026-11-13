import { supabase, isSupabaseConfigured } from './supabase';
import { dbService } from './database';
import type { UserProfile, RegisterData, AuthSession } from '../types/platform';

const AUTH_STORAGE_KEY = 'smartcrop_auth_session_v1';
const USERS_CREDENTIALS_KEY = 'smartcrop_users_credentials_v1';

// Cryptographic Password Hashing Utility (SHA-256 with salt)
async function hashPassword(password: string, salt: string): Promise<string> {
  const text = `${salt}:${password}`;
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoObj && cryptoObj.subtle) {
    const enc = new TextEncoder();
    const hashBuffer = await cryptoObj.subtle.digest('SHA-256', enc.encode(text));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Deterministic fallback
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

interface StoredCredential {
  userId: string;
  email: string;
  passwordHash: string;
  salt: string;
  isVerified: boolean;
  resetToken?: string;
}

function getStoredCredentials(): Map<string, StoredCredential> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(USERS_CREDENTIALS_KEY);
      if (data) {
        return new Map(Object.entries(JSON.parse(data)));
      }
    }
  } catch (err) {
    console.warn('[SmartCrop Auth] Failed loading credentials', err);
  }
  return new Map();
}

function saveStoredCredentials(creds: Map<string, StoredCredential>) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const obj = Object.fromEntries(creds);
      window.localStorage.setItem(USERS_CREDENTIALS_KEY, JSON.stringify(obj));
    }
  } catch (err) {
    console.warn('[SmartCrop Auth] Failed persisting credentials', err);
  }
}

const localCredentials = getStoredCredentials();
let activeSession: AuthSession | null = null;
const authListeners: Array<(user: UserProfile | null) => void> = [];

function notifyAuthChange(user: UserProfile | null) {
  authListeners.forEach(fn => {
    try {
      fn(user);
    } catch (e) {
      console.error('[SmartCrop Auth] Listener error', e);
    }
  });
}

export const authService = {
  /**
   * Validates registration data before submission
   */
  validateRegistration(data: RegisterData): { valid: boolean; errorsEn: string[]; errorsAr: string[] } {
    const errorsEn: string[] = [];
    const errorsAr: string[] = [];

    if (!data.fullName || data.fullName.trim().length < 2) {
      errorsEn.push('Full name must be at least 2 characters long.');
      errorsAr.push('يجب أن يحتوي الاسم الكامل على حرفين على الأقل.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email.trim())) {
      errorsEn.push('Please provide a valid email address.');
      errorsAr.push('يرجى إدخال بريد إلكتروني صالح.');
    }

    if (!data.password || data.password.length < 8) {
      errorsEn.push('Password must be at least 8 characters long.');
      errorsAr.push('يجب أن لا تقل كلمة المرور عن 8 أحرف.');
    }

    if (!/[0-9]/.test(data.password) && !/[!@#$%^&*(),.?":{}|<>]/.test(data.password)) {
      errorsEn.push('Password must contain at least one number or special character.');
      errorsAr.push('يجب أن تحتوي كلمة المرور على رقم أو رمز خاص على الأقل.');
    }

    if (data.password !== data.confirmPassword) {
      errorsEn.push('Passwords do not match.');
      errorsAr.push('كلمات المرور غير متطابقة.');
    }

    if (!data.country || data.country.trim().length === 0) {
      errorsEn.push('Country is required.');
      errorsAr.push('الدولة مطلوبة.');
    }

    if (!data.city || data.city.trim().length === 0) {
      errorsEn.push('City or administrative region is required.');
      errorsAr.push('المدينة أو المحافظة مطلوبة.');
    }

    return {
      valid: errorsEn.length === 0,
      errorsEn,
      errorsAr
    };
  },

  /**
   * Registers a new farmer account
   */
  async register(data: RegisterData): Promise<{ user: UserProfile; requiresVerification: boolean }> {
    const validation = this.validateRegistration(data);
    if (!validation.valid) {
      throw new Error(validation.errorsEn.join(' '));
    }

    const normalizedEmail = data.email.trim().toLowerCase();

    // 1. Supabase Auth if configured
    if (isSupabaseConfigured && supabase) {
      const { data: authData, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
            country: data.country.trim(),
            city: data.city.trim()
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const userId = authData.user?.id;
      if (!userId) {
        throw new Error('Registration failed: no user returned.');
      }

      // Check if profile was auto-created by database trigger
      let profile = await dbService.getProfile(userId);
      if (!profile) {
        // Fallback create profile if trigger is delayed
        profile = {
          id: userId,
          fullName: data.fullName.trim(),
          email: normalizedEmail,
          country: data.country.trim(),
          city: data.city.trim(),
          isVerified: authData.user?.email_confirmed_at ? true : false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await dbService.updateProfile(userId, profile);
      }

      return {
        user: profile,
        requiresVerification: !authData.session
      };
    }

    // 2. Local Cryptographic Registration
    for (const cred of localCredentials.values()) {
      if (cred.email === normalizedEmail) {
        throw new Error('An account with this email already exists.');
      }
    }

    const userId = 'usr_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    const salt = Math.random().toString(36).substring(2, 15);
    const passwordHash = await hashPassword(data.password, salt);
    const now = new Date().toISOString();

    const profile: UserProfile = {
      id: userId,
      fullName: data.fullName.trim(),
      email: normalizedEmail,
      country: data.country.trim(),
      city: data.city.trim(),
      isVerified: true,
      createdAt: now,
      updatedAt: now
    };

    localCredentials.set(userId, {
      userId,
      email: normalizedEmail,
      passwordHash,
      salt,
      isVerified: true
    });
    saveStoredCredentials(localCredentials);

    // Save profile to database store
    await dbService.createProfile(profile);

    // Log account creation activity
    await dbService.logActivity({
      userId,
      activityType: 'account_created',
      descriptionEn: `Welcome to Galaxy Planters! Account created for ${profile.fullName}.`,
      descriptionAr: `مرحباً بك في Galaxy Planters! تم إنشاء حساب جديد باسم ${profile.fullName}.`,
      metadata: { country: profile.country, city: profile.city }
    });

    // Auto-login upon registration
    await this.setSession(profile, true);

    return {
      user: profile,
      requiresVerification: false
    };
  },

  /**
   * Logs in a farmer using email and password
   */
  async login(email: string, password: string, rememberMe = true): Promise<UserProfile> {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Supabase Auth if configured
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (error || !data.user) {
        throw new Error(error?.message || 'Invalid email or password.');
      }

      const profile = await dbService.getProfile(data.user.id);
      if (!profile) {
        throw new Error('User profile record not found.');
      }

      activeSession = {
        token: data.session?.access_token || 'sb_token',
        expiresAt: data.session?.expires_at ? data.session.expires_at * 1000 : Date.now() + 86400000 * 7,
        user: profile
      };
      notifyAuthChange(profile);
      return profile;
    }

    // 2. Local Auth Engine
    let matchedCred: StoredCredential | null = null;
    for (const cred of localCredentials.values()) {
      if (cred.email === normalizedEmail) {
        matchedCred = cred;
        break;
      }
    }

    if (!matchedCred) {
      throw new Error('Invalid email or password.');
    }

    const computedHash = await hashPassword(password, matchedCred.salt);
    if (computedHash !== matchedCred.passwordHash) {
      throw new Error('Invalid email or password.');
    }

    const profile = await dbService.getProfile(matchedCred.userId);
    if (!profile) {
      throw new Error('User profile not found.');
    }

    await this.setSession(profile, rememberMe);
    return profile;
  },

  /**
   * Restores current session on page load
   */
  async restoreSession(): Promise<UserProfile | null> {
    // 1. Supabase Auth Session
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const profile = await dbService.getProfile(data.session.user.id);
        if (profile) {
          activeSession = {
            token: data.session.access_token,
            expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 86400000,
            user: profile
          };
          notifyAuthChange(profile);
          return profile;
        }
      }
      notifyAuthChange(null);
      return null;
    }

    // 2. Local Storage Session
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const serialized = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (serialized) {
          const session: AuthSession = JSON.parse(serialized);
          if (session.expiresAt > Date.now()) {
            // Verify user still exists in database
            const profile = await dbService.getProfile(session.user.id);
            if (profile) {
              activeSession = { ...session, user: profile };
              notifyAuthChange(profile);
              return profile;
            }
          } else {
            // Session expired
            window.localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      }
    } catch (err) {
      console.warn('[SmartCrop Auth] Failed restoring session', err);
    }

    activeSession = null;
    notifyAuthChange(null);
    return null;
  },

  /**
   * Sets the active session
   */
  async setSession(user: UserProfile, remember: boolean): Promise<void> {
    const session: AuthSession = {
      token: 'tok_' + Math.random().toString(36).substring(2) + '_' + Date.now(),
      expiresAt: Date.now() + (remember ? 86400000 * 30 : 86400000), // 30 days or 1 day
      user
    };
    activeSession = session;

    if (typeof window !== 'undefined' && window.localStorage && remember) {
      try {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      } catch (e) {
        console.warn('[SmartCrop Auth] Failed storing session', e);
      }
    }

    notifyAuthChange(user);
  },

  /**
   * Logs out the current user
   */
  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }

    activeSession = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch (e) {
        console.warn('[SmartCrop Auth] Failed removing session', e);
      }
    }

    notifyAuthChange(null);
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    const normalized = email.trim().toLowerCase();
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
        redirectTo: window.location.origin + '?reset=true'
      });
      if (error) throw new Error(error.message);
      return true;
    }

    // Local simulation: verify email exists
    for (const cred of localCredentials.values()) {
      if (cred.email === normalized) {
        cred.resetToken = 'rst_' + Math.random().toString(36).substring(2, 10);
        saveStoredCredentials(localCredentials);
        return true;
      }
    }
    // Return true even if not found to prevent user enumeration attacks
    return true;
  },

  /**
   * Returns current active user or null
   */
  getCurrentUser(): UserProfile | null {
    return activeSession?.user || null;
  },

  /**
   * Returns current active session or null
   */
  getCurrentSession(): AuthSession | null {
    return activeSession;
  },

  /**
   * Subscribes to auth state changes
   */
  onAuthStateChange(callback: (user: UserProfile | null) => void): () => void {
    authListeners.push(callback);
    callback(activeSession?.user || null);
    return () => {
      const index = authListeners.indexOf(callback);
      if (index !== -1) {
        authListeners.splice(index, 1);
      }
    };
  }
};
