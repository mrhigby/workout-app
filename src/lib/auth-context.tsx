"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  signOut as amplifySignOut,
  getCurrentUser,
  fetchUserAttributes,
  resetPassword as amplifyResetPassword,
  confirmResetPassword,
  confirmSignUp,
} from "aws-amplify/auth";
import { User } from "./types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean }>;
  confirmSignUpCode: (email: string, code: string) => Promise<void>;
  signOut: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      setUser({
        id: currentUser.userId,
        email: attributes.email || "",
        name: attributes.preferred_username || attributes.email || "",
      });
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUser().finally(() => setIsLoading(false));
  }, [fetchUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    await amplifySignIn({ username: email, password });
    await fetchUser();
  }, [fetchUser]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const result = await amplifySignUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          preferred_username: name,
        },
      },
    });
    if (result.isSignUpComplete) {
      await amplifySignIn({ username: email, password });
      await fetchUser();
      return { needsConfirmation: false };
    }
    return { needsConfirmation: true };
  }, [fetchUser]);

  const confirmSignUpCode = useCallback(async (email: string, code: string) => {
    await confirmSignUp({ username: email, confirmationCode: code });
  }, []);

  const signOut = useCallback(async () => {
    await amplifySignOut();
    setUser(null);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await amplifyResetPassword({ username: email });
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, signIn, signUp, confirmSignUpCode, signOut, forgotPassword, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
