"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PlayerStatus = "idle" | "loading" | "ready" | "error";

export function TrailerPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [source, setSource] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const closePlayer = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }

    setIsOpen(false);
    setSource(null);
    setStatus("idle");
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePlayer();
    };

    document.body.classList.add("player-open");
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("player-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closePlayer, isOpen]);

  const openPlayer = async () => {
    setIsOpen(true);
    setStatus("loading");

    try {
      const response = await fetch("/api/trailer", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Trailer URL request failed");

      const data = (await response.json()) as { url?: string };
      if (!data.url) throw new Error("Trailer URL missing");

      setSource(data.url);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    if (status !== "ready" || !source || !videoRef.current) return;

    const video = videoRef.current;
    video.load();
    void video.play().catch(() => {
      // Browser autoplay rules may require the viewer to press play.
    });
  }, [source, status]);

  return (
    <>
      <button
        className="watch-button"
        data-testid="watch-trailer"
        id="trailer"
        onClick={openPlayer}
        type="button"
      >
        <span className="watch-button__icon" aria-hidden="true">
          <span />
        </span>
        <span className="watch-button__copy">
          <strong>Watch trailer</strong>
          <small>Turn the sound up</small>
        </span>
      </button>

      {isOpen ? (
        <div
          className="player"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePlayer();
          }}
          role="presentation"
        >
          <section
            aria-label="Monkey Quest official trailer"
            aria-modal="true"
            className="player__dialog"
            role="dialog"
          >
            <button
              aria-label="Close trailer"
              className="player__close"
              onClick={closePlayer}
              type="button"
            >
              <span aria-hidden="true">Close</span>
              <b aria-hidden="true">×</b>
            </button>

            <div className="player__frame">
              {status === "loading" ? (
                <div className="player__state" role="status">
                  <span className="player__loader" aria-hidden="true" />
                  <p>Opening the jungle…</p>
                </div>
              ) : null}

              {status === "error" ? (
                <div className="player__state player__state--error" role="alert">
                  <p className="kicker">Stream offline</p>
                  <h2>The trailer is almost ready.</h2>
                  <p>
                    The private video source has not been connected yet. Once
                    the S3 settings are added, playback will begin here.
                  </p>
                  <button onClick={openPlayer} type="button">
                    Try again
                  </button>
                </div>
              ) : null}

              {status === "ready" && source ? (
                <video
                  autoPlay
                  className="player__video"
                  controls
                  onError={() => setStatus("error")}
                  playsInline
                  poster="/og.png"
                  preload="metadata"
                  ref={videoRef}
                  src={source}
                >
                  Your browser does not support HTML video.
                </video>
              ) : null}
            </div>

            <div className="player__caption">
              <span>Monkey Quest</span>
              <span>Official trailer</span>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
