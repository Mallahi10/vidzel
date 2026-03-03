"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabaseClient";

/* ================= TYPES ================= */

type Role =
  | "organization"
  | "student"
  | "volunteer"
  | "mentor";

type User = {
  id: string;
  email: string;
  role: Role;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    role: Role
  ) => Promise<boolean>;
  login: (
    email: string,
    password: string
  ) => Promise<boolean>;
  logout: () => Promise<void>;
};

/* ================= CONTEXT ================= */

const AuthContext =
  createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  return ctx;
};

/* ================= PROVIDER ================= */

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] =
    useState<User | null>(null);
  const [loading, setLoading] =
    useState(true);

  /* ================= AUTH LISTENER ONLY ================= */

  useEffect(() => {
    const initialize = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const role =
          (session.user.user_metadata?.role as Role) ||
          "volunteer";

        setUser({
          id: session.user.id,
          email: session.user.email!,
          role,
        });
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const role =
            (session.user.user_metadata?.role as Role) ||
            "volunteer";

          setUser({
            id: session.user.id,
            email: session.user.email!,
            role,
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* ================= SIGNUP ================= */

  const signup = async (
    email: string,
    password: string,
    role: Role
  ): Promise<boolean> => {
    const { error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
        },
      });

    if (error) {
      alert(error.message);
      return false;
    }

    return true;
  };

  /* ================= LOGIN ================= */

  const login = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      alert("Invalid email or password");
      return false;
    }

    return true;
  };

  /* ================= LOGOUT ================= */

  const logout = async () => {
    await supabase.auth.signOut();
    // DO NOT manually setUser here.
    // Auth listener will handle it.
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};