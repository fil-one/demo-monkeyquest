"use client";

import { useEffect, useState } from "react";
import { TrailerExperience } from "./TrailerExperience";
import { Language, translations } from "./translations";

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const copy = translations[language];

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("monkeyquest-language");
    if (savedLanguage === "en" || savedLanguage === "ja") {
      setLanguage(savedLanguage);
      document.documentElement.lang = savedLanguage;
    }
  }, []);

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;
    window.localStorage.setItem("monkeyquest-language", nextLanguage);
  };

  return (
    <main>
      <TrailerExperience
        language={language}
        onLanguageChange={changeLanguage}
      />

      <div className="content-shell">
        <section className="feature-strip" aria-label={copy.highlightsLabel}>
          {copy.features.map((feature) => (
            <article className="feature" key={feature.title}>
              <span className="feature__icon" aria-hidden="true">
                {feature.icon}
              </span>
              <h2>{feature.title}</h2>
              <p>{feature.copy}</p>
            </article>
          ))}

          <article className="feature feature--studio">
            <a
              aria-label="Toei Animation"
              className="toei-badge"
              href="https://corp.toei-anim.co.jp/"
            >
              <img
                alt="Toei Animation"
                src="/toei-animation.png"
                width="597"
                height="78"
              />
            </a>
            <h2>
              {copy.madeByLead}
              <a href="https://corp.toei-anim.co.jp/">{copy.studio}</a>
              {copy.madeByTail}
            </h2>
            <p>{copy.madeByCopy}</p>
          </article>
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
            {copy.builtOnLead}{" "}
            <a href="https://filecoin.io/">Filecoin</a>. {copy.builtOnTail}
          </p>
        </footer>
      </div>
    </main>
  );
}
