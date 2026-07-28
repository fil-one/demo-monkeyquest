import { siteContent } from "@/content/site";
import { TrailerPlayer } from "./TrailerPlayer";

export default function Home() {
  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__atmosphere" aria-hidden="true">
          <span className="hero__moon" />
          <span className="hero__ridge hero__ridge--back" />
          <span className="hero__ridge hero__ridge--front" />
          <span className="hero__glow" />
          <span className="hero__grain" />
        </div>

        <header className="site-header">
          <a className="brand" href="#top" aria-label="Monkey Quest home">
            <span>MQ</span>
            <small>Monkey Quest</small>
          </a>

          <nav aria-label="Main navigation">
            <a href="#story">Story</a>
            <a href="#journey">The journey</a>
          </nav>

          <a className="header-cta" href="#trailer">
            Watch trailer
          </a>
        </header>

        <div className="hero__content" id="top">
          <p className="eyebrow">
            <span />
            {siteContent.eyebrow}
          </p>

          <h1 id="hero-title">
            <span>Monkey</span>
            <span>Quest</span>
          </h1>

          <div className="hero__lower">
            <div className="hero__tagline">
              <p>{siteContent.tagline}</p>
              <span>Coming soon</span>
            </div>
            <TrailerPlayer />
          </div>
        </div>

        <div className="hero__scroll" aria-hidden="true">
          <span />
          <small>Enter the wild</small>
        </div>
      </section>

      <section className="story" id="story" aria-labelledby="story-title">
        <div className="story__intro">
          <p className="section-label">The story</p>
          <h2 id="story-title">{siteContent.quote}</h2>
        </div>

        <div className="story__copy">
          <p>{siteContent.synopsis}</p>
          <p>{siteContent.story}</p>
        </div>

        <dl className="facts">
          {siteContent.facts.map(([term, description]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="journey" id="journey" aria-labelledby="journey-title">
        <div className="journey__heading">
          <p className="section-label">Beyond the canopy</p>
          <h2 id="journey-title">
            The map ends.
            <br />
            The adventure begins.
          </h2>
        </div>

        <div className="chapters">
          {siteContent.chapters.map((chapter) => (
            <article className="chapter" key={chapter.number}>
              <span>{chapter.number}</span>
              <div>
                <h3>{chapter.title}</h3>
                <p>{chapter.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="finale" aria-label="Watch Monkey Quest">
        <p className="section-label">Take the leap</p>
        <p className="finale__title">Monkey Quest</p>
        <a href="#trailer">Watch the official trailer</a>
      </section>

      <footer>
        <a className="brand brand--footer" href="#top">
          <span>MQ</span>
          <small>Monkey Quest</small>
        </a>
        <p>© 2026 Monkey Quest. All rights reserved.</p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
