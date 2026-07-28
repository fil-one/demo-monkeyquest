import { TrailerExperience } from "./TrailerExperience";

const features = [
  {
    icon: "◎",
    title: "Epic Universe",
    copy: "Explore breathtaking worlds across the galaxy.",
  },
  {
    icon: "◉",
    title: "Unlikely Heroes",
    copy: "A mischievous monkey and a brave new friend.",
  },
  {
    icon: "➤",
    title: "Action & Adventure",
    copy: "Fast-paced, fun-filled journeys await.",
  },
] as const;

const storageFeatures = [
  {
    icon: "◇",
    title: "Secure & Verifiable",
    copy: "Content stored with verifiable integrity.",
  },
  {
    icon: "◎",
    title: "Decentralized",
    copy: "Built for an open, resilient web.",
  },
  {
    icon: "ϟ",
    title: "Fast & Reliable",
    copy: "Stream with confidence from a global network.",
  },
] as const;

export default function Home() {
  return (
    <main>
      <TrailerExperience />

      <div className="content-shell">
        <section className="feature-strip" aria-label="Film highlights">
          {features.map((feature) => (
            <article className="feature" key={feature.title}>
              <span className="feature__icon" aria-hidden="true">
                {feature.icon}
              </span>
              <h2>{feature.title}</h2>
              <p>{feature.copy}</p>
            </article>
          ))}

          <article className="feature feature--studio">
            <div className="toei-badge">
              <img
                alt="Toei Animation"
                src="/toei-animation.png"
                width="597"
                height="78"
              />
            </div>
            <h2>Made by Toei Animation</h2>
            <p>Bringing unforgettable stories to life.</p>
          </article>
        </section>

        <section className="filecoin-panel" aria-labelledby="filecoin-title">
          <div className="filecoin-panel__brand">
            <span className="filecoin-orb">
              <img
                alt=""
                src="/filecoin.svg"
                width="40"
                height="40"
              />
            </span>
            <div>
              <p>Powered by</p>
              <h2 id="filecoin-title">Filecoin</h2>
            </div>
          </div>

          <div className="storage-features">
            {storageFeatures.map((feature) => (
              <article key={feature.title}>
                <span aria-hidden="true">{feature.icon}</span>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.copy}</p>
                </div>
              </article>
            ))}
          </div>

        </section>

        <footer>
          <div className="footer-domain">
            <img
              alt="Filecoin"
              src="/filecoin.svg"
              width="40"
              height="40"
            />
            <strong>monkeyquest.fil.one</strong>
          </div>
          <i />
          <p>
            Built on <a href="https://filecoin.io/">Filecoin</a>. For everyone.
          </p>
        </footer>
      </div>
    </main>
  );
}
