"use client";

import { useEffect, useRef, useState } from "react";

type PlayerStatus = "idle" | "loading" | "ready" | "error";

export function TrailerExperience() {
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [source, setSource] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const resetTrailer = () => {
    videoRef.current?.pause();
    setIsPaused(true);
    setStatus("idle");
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

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
        {source ? (
          <video
            className="hero__video"
            controls
            onError={() => setStatus("error")}
            onPause={() => setIsPaused(true)}
            onPlay={() => setIsPaused(false)}
            playsInline
            poster="/hero-keyart.png"
            preload="metadata"
            ref={videoRef}
            src={source}
          >
            Your browser does not support HTML video.
          </video>
        ) : null}
        <div className="hero__shade" aria-hidden="true" />
      </div>

      <header className="site-header">
        <a className="title-mark" href="#trailer" aria-label="Monkey Quest home">
          <small>Hypergalactic</small>
          <span>
            Monkey
            <b>Quest</b>
          </span>
        </a>

        <nav aria-label="Main navigation">
          <a aria-current="page" href="#trailer">
            Trailer
          </a>
        </nav>

        <span className="language" aria-label="English language">
          <span aria-hidden="true">◎</span>
          EN
        </span>
      </header>

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

      {status === "ready" ? (
        <div className="player-banner">
          <div className="player-banner__title">
            <span>Now playing</span>
            <strong>Monkey Quest · Official Trailer</strong>
          </div>
          <div className="player-banner__actions">
            <button
              aria-label={isPaused ? "Play trailer" : "Pause trailer"}
              className="player-banner__toggle"
              onClick={togglePlayback}
              type="button"
            >
              <span
                aria-hidden="true"
                className={isPaused ? "control-play" : "control-pause"}
              />
              {isPaused ? "Play" : "Pause"}
            </button>
            <button
              className="player-banner__return"
              onClick={resetTrailer}
              type="button"
            >
              Back to poster
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
