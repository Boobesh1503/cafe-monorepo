import { CoffeeIllustration } from '@/components/coffee-illustration';
import { MenuSection } from '@/components/menu-section';
import { SiteHeader } from '@/components/site-header';
import { getMenuForDisplay } from '@/api';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const menu = await getMenuForDisplay();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <section className="hero section-wrap" id="top" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> Your neighborhood, at its own pace
            </p>
            <h1 id="hero-title">
              A little room
              <br />
              to <em>slow down.</em>
            </h1>
            <p className="hero-description">
              Thoughtful coffee, something warm from the oven, and a place that feels like yours.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#menu">
                Explore the menu <span aria-hidden="true">↘</span>
              </a>
              <a className="text-link" href="#visit">
                Come say hello <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="hero-note">
              <span className="note-line" />
              <p>
                POURED WITH CARE
                <br />
                <strong>EVERY SINGLE DAY</strong>
              </p>
            </div>
          </div>
          <div className="hero-art">
            <span className="art-ring art-ring-one" />
            <span className="art-ring art-ring-two" />
            <CoffeeIllustration />
            <div className="hero-sticker">
              <span>
                good
                <br />
                mornings
                <br />
                start here
              </span>
              <i>✳</i>
            </div>
            <p className="art-caption">a slower kind of lovely</p>
          </div>
          <div className="hero-bottom">
            <span>EST. WITH LOVE · 2024</span>
            <a href="#story">
              A note from our little corner <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <div className="ticker" aria-label="Coffee, community, and a little everyday joy">
          <div className="ticker-track" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i}>
                GOOD COFFEE <i>✳</i> GOOD COMPANY <i>✳</i> A LITTLE EVERYDAY JOY <i>✳</i>
              </span>
            ))}
          </div>
        </div>

        <MenuSection items={menu} />

        <section className="story-section" id="story" aria-labelledby="story-title">
          <div className="story-art" aria-hidden="true">
            <div className="story-sun" />
            <div className="story-vase">
              <span />
              <i />
              <b />
            </div>
            <span className="story-scribble">
              take it
              <br />
              easy
            </span>
            <span className="story-art-caption">a seat saved for you</span>
          </div>
          <div className="story-copy">
            <p className="eyebrow">
              <span /> A place to land
            </p>
            <h2 id="story-title">
              The best days
              <br />
              have <em>soft edges.</em>
            </h2>
            <p>
              We believe a good cafe is more than what’s in your cup. It’s the familiar hello, the
              window seat, the five extra minutes you didn’t know you needed.
            </p>
            <p>
              So we keep the coffee thoughtful, the welcome easy, and a little space open for
              whatever your day brings.
            </p>
            <a className="text-link" href="#visit">
              A little more about us <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        <section className="visit-section section-wrap" id="visit" aria-labelledby="visit-title">
          <div className="visit-top">
            <p className="eyebrow">
              <span /> The door is always open
            </p>
            <span className="visit-stamp" aria-hidden="true">
              see you
              <br />
              soon <i>✳</i>
            </span>
          </div>
          <div className="visit-content">
            <h2 id="visit-title">
              Make yourself
              <br />
              <em>at home.</em>
            </h2>
            <div className="visit-details">
              <div>
                <h3>Find our little corner</h3>
                <p>
                  18 Garden Lane
                  <br />
                  Brookside, NY 10012
                </p>
                <a
                  className="text-link"
                  href="https://maps.google.com/?q=18+Garden+Lane+Brookside"
                  target="_blank"
                  rel="noreferrer"
                >
                  Get directions <span aria-hidden="true">↗</span>
                </a>
              </div>
              <div>
                <h3>Come whenever</h3>
                <p>
                  Monday – Friday <span>7:30 am — 4 pm</span>
                  <br />
                  Saturday – Sunday <span>8 am — 3 pm</span>
                </p>
                <a className="text-link" href="mailto:hello@hearthandhill.example">
                  Say hello <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </div>
          <div className="visit-footer">
            <span>GOOD THINGS GROW HERE</span>
            <span>✳ &nbsp; COFFEE · COMMUNITY · COMFORT &nbsp; ✳</span>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <a className="brand" href="#top">
          <span className="brand-stamp" aria-hidden="true">
            h
          </span>
          <span className="brand-name">
            hearth <i>&</i> hill
          </span>
        </a>
        <p>
          Made for the little moments. <span>© 2025 Hearth & Hill</span>
        </p>
        <a href="#top">Back to the top ↑</a>
      </footer>
    </>
  );
}
