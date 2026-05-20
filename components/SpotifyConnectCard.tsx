"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Sparkles } from "lucide-react";

type SpotifyStatus = {
  configured: boolean;
  connected: boolean;
};

export function SpotifyConnectCard() {
  const [status, setStatus] = useState<SpotifyStatus | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/spotify/status");
      const data = await response.json();
      if (response.ok) {
        setStatus({
          configured: data.configured,
          connected: data.connected,
        });
      } else {
        setStatus({ configured: false, connected: false });
      }
    } catch {
      setStatus({ configured: false, connected: false });
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/spotify/disconnect", { method: "POST" });
      await loadStatus();
    } finally {
      setDisconnecting(false);
    }
  }

  if (status === null) {
    return (
      <article className="section-card">
        <section className="section-card-body gap-3">
          <span className="loading loading-spinner loading-md text-primary" />
        </section>
      </article>
    );
  }

  if (!status.configured) {
    return (
      <article className="section-card border-l-4 border-l-warning">
        <section className="section-card-body gap-4">
          <header className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-warning" aria-hidden />
            <h2 className="section-title">Connect your Spotify account</h2>
          </header>
          <p className="text-sm text-base-content/70">
            One-time setup: add Spotify API keys to <code className="text-xs">.env.local</code>,
            then click Connect to link your personal account.
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-base-content/80">
            <li>
              Open{" "}
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary inline-flex items-center gap-1"
              >
                Spotify Developer Dashboard
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>{" "}
              and create an app.
            </li>
            <li>
              Set Redirect URI to:{" "}
              <code className="rounded bg-base-200 px-1 text-xs">
                {process.env.NEXT_PUBLIC_APP_URL
                  ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/spotify/callback`
                  : "http://127.0.0.1:3000/api/spotify/callback"}
              </code>
            </li>
            <li>
              Copy Client ID and Client Secret into{" "}
              <code className="text-xs">.env.local</code> (see{" "}
              <code className="text-xs">.env.local.example</code>).
            </li>
            <li>Restart the dev server (<code className="text-xs">start-dev.cmd</code>).</li>
            <li>Click Connect Spotify below.</li>
          </ol>
          <a
            href="/api/spotify/connect"
            className="btn btn-primary btn-interactive w-fit gap-2"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Connect Spotify
          </a>
        </section>
      </article>
    );
  }

  if (status.connected) {
    return (
      <article className="section-card border-l-4 border-l-success">
        <section className="section-card-body flex flex-wrap items-center justify-between gap-4">
          <section className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-success" aria-hidden />
            <section>
              <h2 className="section-title">Spotify connected</h2>
              <p className="text-sm text-base-content/70">
                Your personal account is linked. View personalized shows on For You.
              </p>
            </section>
          </section>
          <section className="flex flex-wrap gap-2">
            <Link href="/recommended" className="btn btn-primary btn-sm btn-interactive">
              View recommendations
            </Link>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-interactive"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          </section>
        </section>
      </article>
    );
  }

  return (
    <article className="section-card border-l-4 border-l-primary">
      <section className="section-card-body flex flex-wrap items-center justify-between gap-4">
        <section className="flex items-start gap-3">
          <Sparkles className="h-6 w-6 shrink-0 text-primary" aria-hidden />
          <section>
            <h2 className="section-title">Connect your Spotify account</h2>
            <p className="text-sm text-base-content/70">
              Link your personal Spotify to get concert recommendations based on
              your top artists and listening history.
            </p>
          </section>
        </section>
        <a
          href="/api/spotify/connect"
          className="btn btn-primary btn-interactive gap-2"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          Connect Spotify
        </a>
      </section>
    </article>
  );
}
