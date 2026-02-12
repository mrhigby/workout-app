"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User } from "./types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = "workout_app_users";
const CURRENT_USER_KEY = "workout_app_current_user";

interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string;
}

function getStoredUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const users = getStoredUsers();
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) {
      throw new Error("Invalid email or password");
    }
    const userData: User = { id: found.id, email: found.email, name: found.name };
    setUser(userData);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const users = getStoredUsers();
    if (users.find((u) => u.email === email)) {
      throw new Error("An account with this email already exists");
    }
    const newUser: StoredUser = {
      id: `user-${Date.now()}`,
      email,
      name,
      password,
    };
    saveStoredUsers([...users, newUser]);
    const userData: User = { id: newUser.id, email: newUser.email, name: newUser.name };
    setUser(userData);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const users = getStoredUsers();
    if (!users.find((u) => u.email === email)) {
      throw new Error("No account found with this email");
    }
    // In local mode, we just acknowledge the request
    // With Amplify, this would send a reset code via Cognito
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    // In local mode, accept any code and reset the password
    const users = getStoredUsers();
    const idx = users.findIndex((u) => u.email === email);
    if (idx === -1) {
      throw new Error("No account found with this email");
    }
    users[idx].password = newPassword;
    saveStoredUsers(users);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, signIn, signUp, signOut, forgotPassword, resetPassword }}
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
