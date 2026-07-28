"use client";

import { useEffect, useRef, useState } from "react";

type PlayerStatus = "idle" | "loading" | "ready" | "error";

export function TrailerExperience() {
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [source, setSource] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearControlsTimer = () => {
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = null;
    }
  };

  const showControlsThenFade = () => {
    clearControlsTimer();
    setControlsVisible(true);

    if (!videoRef.current?.paused) {
      controlsTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 1600);
    }
  };

  const playTrailer = async () => {
    if (status === "loading") return;
    if (source) {
      setStatus("ready");
      void videoRef.current?.play().then(() => setIsPaused(false));
      return;
    }

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

    videoRef.current.load();
    void videoRef.current
      .play()
      .then(() => setIsPaused(false))
      .catch(() => setIsPaused(true));
  }, [source, status]);

  useEffect(() => () => clearControlsTimer(), []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    setControlsVisible(true);
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  return (
    <section
      className={`hero ${status === "ready" ? "hero--playing" : ""}`}
      id="trailer"
      aria-labelledby="hero-title"
    >
      <div className="hero__media">
        <img
          alt=""
          className="hero__poster"
          src="/hero-keyart.png"
          width="1672"
          height="941"
        />
        <div className="hero__shade" aria-hidden="true" />
      </div>

      <header className="site-header">
        <a
          className="title-mark"
          href="https://monkeyquest.fil.one/"
          aria-label="Monkey Quest home"
        >
          <small>Hypergalactic</small>
          <span>
            Monkey
            <b>Quest</b>
          </span>
        </a>

        <span className="language" aria-label="English language">
          <span aria-hidden="true">◎</span>
          EN
        </span>
      </header>

      {source ? (
        <div
          className="player-frame"
          onMouseLeave={() => {
            if (!isPaused) setControlsVisible(false);
          }}
          onMouseMove={showControlsThenFade}
          onTouchStart={showControlsThenFade}
        >
          <video
            className="hero__video"
            onClick={togglePlayback}
            onEnded={() => {
              clearControlsTimer();
              setIsPaused(true);
              setControlsVisible(true);
            }}
            onError={() => setStatus("error")}
            onPause={() => {
              clearControlsTimer();
              setIsPaused(true);
              setControlsVisible(true);
            }}
            onPlay={() => {
              setIsPaused(false);
              showControlsThenFade();
            }}
            playsInline
            poster="/hero-keyart.png"
            preload="metadata"
            ref={videoRef}
            src={source}
          >
            Your browser does not support HTML video.
          </video>

          <div
            className={`player-controls ${
              controlsVisible ? "player-controls--visible" : ""
            }`}
          >
            <button
              aria-label={isPaused ? "Play trailer" : "Pause trailer"}
              className="player-controls__toggle"
              onFocus={() => setControlsVisible(true)}
              onClick={togglePlayback}
              type="button"
            >
              <span
                aria-hidden="true"
                className={isPaused ? "control-play" : "control-pause"}
              />
            </button>
          </div>
        </div>
      ) : null}

      {status !== "ready" ? (
        <button
          aria-label="Play the Monkey Quest trailer"
          className="hero__play"
          onClick={playTrailer}
          type="button"
        >
          <span aria-hidden="true" />
        </button>
      ) : null}

      <div className="hero__copy">
        <span className="studio-label">Toei Animation</span>
        <h1 id="hero-title">Monkey Quest</h1>
        <p>
          An epic adventure across galaxies.
          <br />
          One monkey. One hero. Countless worlds.
        </p>

        <button
          className="trailer-cta"
          data-testid="watch-trailer"
          onClick={playTrailer}
          type="button"
        >
          <span aria-hidden="true" />
          Watch Trailer
        </button>

        <div className="trailer-meta">
          <span aria-hidden="true">◷</span>
          <span>1080p</span>
          <i />
          <span>Official Trailer</span>
        </div>
      </div>

      {status === "loading" ? (
        <div className="hero__status" role="status">
          <span />
          <p>Connecting to the trailer…</p>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="hero__error" role="alert">
          <p>The trailer could not be opened.</p>
          <button onClick={playTrailer} type="button">
            Try again
          </button>
        </div>
      ) : null}

    </section>
  );
}
