"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  disconnectHubSpot,
  exchangeHubSpotCode,
  getHubSpotAuthUrl,
  getHubSpotConnection,
  getHubSpotStatus,
  isHubSpotReady,
  saveHubSpotConnection,
} from "@/lib/hubspot-client";
import { Link2, Unlink, CheckCircle2 } from "lucide-react";

const SKIP_KEY = "sta-hubspot-skipped";

interface HubSpotConnectProps {
  compact?: boolean;
}

export function HubSpotConnect({ compact }: HubSpotConnectProps) {
  const { user, isDemo } = useAuth();
  const [ready, setReady] = useState(false);
  const [staticMode, setStaticMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || isDemo) {
      setLoading(false);
      return;
    }

    async function check() {
      const status = await getHubSpotStatus();
      setStaticMode(status.mode === "static");

      if (status.mode === "static") {
        setReady(true);
        setLoading(false);
        return;
      }

      const isReady = await isHubSpotReady(user!.uid);
      setReady(isReady);
      setLoading(false);
      if (!isReady && status.mode === "oauth" && !localStorage.getItem(SKIP_KEY)) {
        setShowOnboarding(true);
      }
    }

    check();
  }, [user, isDemo]);

  useEffect(() => {
    if (!user || isDemo) return;

    const params = new URLSearchParams(window.location.search);
    const hubspot = params.get("hubspot");
    const authCode = params.get("code");
    if (hubspot !== "callback" || !authCode || !user) return;

    const uid = user.uid;
    const oauthCode = authCode;

    async function completeOAuth() {
      setConnecting(true);
      setError("");
      setShowOnboarding(false);
      try {
        const auth = getFirebaseAuth();
        const idToken = await auth?.currentUser?.getIdToken();
        if (!idToken) throw new Error("Not signed in");

        const tokens = await exchangeHubSpotCode(idToken, oauthCode);
        await saveHubSpotConnection(uid, tokens);
        setReady(true);
        localStorage.removeItem(SKIP_KEY);

        params.delete("hubspot");
        params.delete("code");
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
        window.history.replaceState({}, "", newUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "HubSpot connection failed");
      } finally {
        setConnecting(false);
      }
    }

    completeOAuth();
  }, [user, isDemo]);

  const handleConnect = async () => {
    if (!user) return;
    setConnecting(true);
    setError("");
    try {
      const auth = getFirebaseAuth();
      const idToken = await auth?.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not signed in");

      const url = await getHubSpotAuthUrl(idToken);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start HubSpot connection");
      setConnecting(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(SKIP_KEY, "1");
    setShowOnboarding(false);
  };

  const handleDisconnect = async () => {
    if (!user) return;
    await disconnectHubSpot(user.uid);
    setReady(false);
  };

  if (isDemo || !user) return null;

  const statusLabel = staticMode
    ? "HubSpot connected (team token)"
    : "HubSpot connected";

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {ready ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-sta-navy">{statusLabel}</span>
            {!staticMode && (
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            )}
          </>
        ) : (
          <>
            <span className="text-sm text-sta-teal">Connect HubSpot to send follow-ups</span>
            <Button size="sm" onClick={handleConnect} disabled={connecting || loading}>
              <Link2 className="mr-2 h-4 w-4" />
              {connecting ? "Connecting..." : "Connect HubSpot"}
            </Button>
          </>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <>
      {!staticMode && (
        <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sta-navy">Connect HubSpot</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-sta-teal">
              Connect HubSpot once to pull contacts and send follow-up emails from this dashboard.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={handleConnect} disabled={connecting}>
                <Link2 className="mr-2 h-4 w-4" />
                Connect HubSpot
              </Button>
              <Button variant="outline" onClick={handleSkip}>
                Skip for now
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {ready && (
        <div className="flex items-center justify-between rounded border border-green-200 bg-green-50 px-4 py-2">
          <span className="flex items-center gap-2 text-sm font-medium text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            {statusLabel}
          </span>
          {!staticMode && (
            <Button variant="ghost" size="sm" onClick={handleDisconnect}>
              <Unlink className="mr-1 h-3 w-3" />
              Disconnect
            </Button>
          )}
        </div>
      )}
    </>
  );
}
