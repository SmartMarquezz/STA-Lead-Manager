"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import {
  onAuthChange,
  signInWithGoogle,
  signInWithGoogleRedirect,
  completeGoogleRedirectSignIn,
  getAuthErrorMessage,
  User,
} from "@/lib/auth";
import { isFirebaseConfigured } from "@/lib/firebase";
import { enableDemoMode, isDemoMode, disableDemoMode } from "@/lib/demo-data";
import { StaLogo } from "@/components/StaLogo";
import { NavBar } from "./NavBar";
import { SyncProvider } from "./SyncProvider";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isDemo: false });

export function useAuth() {
  return useContext(AuthContext);
}

const demoUserAsFirebaseUser = {
  displayName: "Jim (Demo)",
  email: "demo@sta-lead-manager.local",
  photoURL: null,
  uid: "demo-user",
} as User;

function AuthScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-[#E2EDF5] bg-white px-6 py-4">
        <StaLogo size="sm" href="#" />
      </header>

      <section className="sta-hero py-16 md:py-24">
        <div className="sta-hero-ripples" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-lg text-center lg:text-left">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-white/75">
              Securities Traders Association
            </p>
            <h1 className="mt-4 font-sans text-4xl font-bold uppercase leading-tight md:text-5xl">
              The Pipeline
              <br />
              <span className="text-5xl md:text-6xl">In Focus</span>
            </h1>
            <p className="mt-6 text-lg text-white/85">
              Manage sponsors, leads, and revenue for the STA Market Structure Conference.
            </p>
          </div>

          <div className="sta-panel w-full max-w-md p-8">
            <h2 className="text-center text-sm font-bold uppercase tracking-[0.2em] text-white">
              {title}
            </h2>
            <div className="sta-divider my-4" />
            <p className="text-center text-sm text-white/80">{subtitle}</p>
            <div className="mt-8 space-y-3">{children}</div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let unsubscribe = () => {};

    async function initAuth() {
      if (isDemoMode()) {
        setDemo(true);
        setUser(demoUserAsFirebaseUser);
        setLoading(false);
        return;
      }

      if (!isFirebaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        const redirectUser = await completeGoogleRedirectSignIn();
        if (redirectUser) {
          setUser(redirectUser);
        }
      } catch (error) {
        setAuthError(getAuthErrorMessage(error));
      }

      unsubscribe = onAuthChange((u) => {
        setUser(u);
        setLoading(false);
        if (u) setAuthError("");
      });
    }

    initAuth();
    return () => unsubscribe();
  }, []);

  const handleEnterDemo = () => {
    enableDemoMode();
    setDemo(true);
    setUser(demoUserAsFirebaseUser);
  };

  const handleSignInPopup = useCallback(async () => {
    setSigningIn(true);
    setAuthError("");
    try {
      await signInWithGoogle();
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setSigningIn(false);
    }
  }, []);

  const handleSignInRedirect = useCallback(async () => {
    setSigningIn(true);
    setAuthError("");
    try {
      await signInWithGoogleRedirect();
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
      setSigningIn(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <StaLogo size="md" href="#" />
          <div className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-4 border-[#D8E8F2] border-t-sta-cyan" />
          <p className="mt-4 text-sta-teal">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isFirebaseConfigured() && !demo) {
    return (
      <AuthScreen
        title="Lead Manager"
        subtitle="Firebase is not configured yet. Explore the app with sample data, or add credentials to .env.local / Vercel."
      >
        <button className="sta-btn-primary w-full" onClick={handleEnterDemo}>
          Explore Demo
        </button>
      </AuthScreen>
    );
  }

  if (!user) {
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "localhost";

    return (
      <AuthScreen
        title="Sign In"
        subtitle="Sign in with your Google account to access the sponsor pipeline and sync live spreadsheet data."
      >
        {authError && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-left text-sm text-red-800">
            {authError}
          </div>
        )}

        <button
          className="sta-btn-primary w-full disabled:opacity-60"
          onClick={handleSignInPopup}
          disabled={signingIn}
        >
          {signingIn ? "Signing in..." : "Sign In with Google"}
        </button>

        <button
          className="sta-btn-outline w-full disabled:opacity-60"
          onClick={handleSignInRedirect}
          disabled={signingIn}
        >
          Continue with redirect (if popup blocked)
        </button>

        <p className="text-center text-xs text-white/60">
          Firebase must allow this domain: <strong className="text-white/80">{hostname}</strong>
        </p>

        <button className="sta-btn-outline w-full" onClick={handleEnterDemo}>
          Explore Demo
        </button>
      </AuthScreen>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, isDemo: demo }}>
      <SyncProvider enabled={!demo && isFirebaseConfigured()}>
        <div className="min-h-screen bg-background">
          {demo && (
            <div className="bg-sta-navy px-4 py-2 text-center text-sm font-medium text-white">
              Demo mode — showing sample data only. Google sign-in is required to sync your live spreadsheet.{" "}
              <button
                className="font-bold underline"
                onClick={() => {
                  disableDemoMode();
                  setDemo(false);
                  setUser(null);
                  window.location.reload();
                }}
              >
                Sign in with Google
              </button>
            </div>
          )}
          <NavBar user={user} />
          <main>{children}</main>
        </div>
      </SyncProvider>
    </AuthContext.Provider>
  );
}
