"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ================= TYPES ================= */

type Role = "organization" | "student" | "volunteer" | "mentor";

type User = {
  id: string;
  email: string;
  role: Role;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string, role: Role) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

/* ================= PROVIDER ================= */

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ===== RESTORE SESSION ON LOAD ===== */
  useEffect(() => {
    const restoreSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        const role =
          (data.session.user.user_metadata?.role as Role) || "volunteer";

        setUser({
          id: data.session.user.id,
          email: data.session.user.email!,
          role,
        });
      }

      setLoading(false);
    };

    restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }

      const role =
        (session.user.user_metadata?.role as Role) || "volunteer";

      setUser({
        id: session.user.id,
        email: session.user.email!,
        role,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ================= SIGNUP ================= */

  const signup = async (
    email: string,
    password: string,
    role: Role
  ): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
      },
    });

    if (error || !data.user) {
      alert(error?.message || "Signup failed");
      return false;
    }

    setUser({
      id: data.user.id,
      email: data.user.email!,
      role,
    });

    return true;
  };

  /* ================= LOGIN ================= */

  const login = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      alert("Invalid email or password");
      return false;
    }

    const role =
      (data.user.user_metadata?.role as Role) || "volunteer";

    setUser({
      id: data.user.id,
      email: data.user.email!,
      role,
    });

    return true;
  };

  /* ================= LOGOUT ================= */

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};