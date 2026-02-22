"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

/* ================= TYPES ================= */

type Role = "organization" | "student" | "volunteer" | "mentor";

type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
};

type AuthContextType = {
  user: User | null;
  signup: (
    name: string,
    email: string,
    password: string,
    role: Role
  ) => boolean;
  login: (email: string, password: string) => User | null;
  logout: () => void;
};

/* ================= HELPERS ================= */

function normalizeRole(role: unknown): Role {
  if (typeof role !== "string") return "volunteer";
  const r = role.trim().toLowerCase();
  if (r === "organization" || r === "student" || r === "volunteer" || r === "mentor") {
    return r as Role;
  }
  return "volunteer";
}

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

  /* ========== RESTORE SESSION ========== */
  useEffect(() => {
    const session = localStorage.getItem("vidzel_session");
    if (!session) return;

    const parsed = JSON.parse(session);
    const restored: User = {
      ...parsed,
      role: normalizeRole(parsed.role),
    };

    setUser(restored);
    localStorage.setItem("vidzel_session", JSON.stringify(restored));
  }, []);

  /* ========== STORAGE HELPERS ========== */

  const getAccounts = (): User[] =>
    JSON.parse(localStorage.getItem("vidzel_accounts") || "[]");

  const saveAccounts = (accounts: User[]) =>
    localStorage.setItem("vidzel_accounts", JSON.stringify(accounts));

  const getProfiles = () =>
    JSON.parse(localStorage.getItem("vidzel_profiles") || "[]");

  const saveProfiles = (profiles: any[]) =>
    localStorage.setItem("vidzel_profiles", JSON.stringify(profiles));

  /* ================= SIGNUP ================= */

  const signup = (
    name: string,
    email: string,
    password: string,
    role: Role
  ) => {
    const accounts = getAccounts();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = normalizeRole(role);

    if (accounts.some((u) => u.email === normalizedEmail)) {
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: name.trim(),
      email: normalizedEmail,
      password: password.trim(),
      role: normalizedRole,
    };

    saveAccounts([...accounts, newUser]);

    // auto-create profile ONLY for non-organizations
    if (normalizedRole !== "organization") {
      const profiles = getProfiles();
      profiles.push({
        userId: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        bio: "",
        location: "",
        skills: [],
        createdAt: new Date().toISOString(),
      });
      saveProfiles(profiles);
    }

    localStorage.setItem("vidzel_session", JSON.stringify(newUser));
    setUser(newUser);

    return true;
  };

  /* ================= LOGIN (CRITICAL FIX) ================= */

  const login = (email: string, password: string): User | null => {
    const accounts = getAccounts();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    // 🔴 SEARCH FROM LAST TO FIRST (FIXES ROLE OVERRIDE BUG)
    const found = [...accounts]
      .reverse()
      .find(
        (u) =>
          u.email === normalizedEmail &&
          u.password === normalizedPassword
      );

    if (!found) return null;

    const normalizedUser: User = {
      ...found,
      role: normalizeRole(found.role),
    };

    localStorage.setItem("vidzel_session", JSON.stringify(normalizedUser));
    setUser(normalizedUser);

    return normalizedUser;
  };

  /* ================= LOGOUT ================= */

  const logout = () => {
    localStorage.removeItem("vidzel_session");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};