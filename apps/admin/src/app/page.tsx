import Link from 'next/link';

const cards = [
  { label: 'Today’s orders', value: '—', note: 'Order management is not enabled yet', icon: '↗' },
  { label: 'Menu items', value: '04', note: 'Sample items in the Phase 1 catalog', icon: '◌' },
  { label: 'Store status', value: 'Open', note: 'Hours are informational only', icon: '✳' },
];

export default function AdminHome() {
  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <Link className="admin-brand" href="/" aria-label="Hearth and Hill dashboard">
          <span>h</span>
          <strong>
            hearth <i>&</i> hill
          </strong>
        </Link>
        <p className="sidebar-label">WORKSPACE</p>
        <a className="side-link active" href="#overview">
          <span>⌂</span> Overview
        </a>
        <a className="side-link" href="#menu">
          <span>◫</span> Menu <small>soon</small>
        </a>
        <a className="side-link" href="#settings">
          <span>⚙</span> Settings <small>soon</small>
        </a>
        <div className="sidebar-bottom">
          <span className="avatar">HH</span>
          <span>
            Hearth & Hill<small>Admin foundation</small>
          </span>
        </div>
      </aside>
      <section className="dashboard" id="overview">
        <header className="topbar">
          <span>
            Workspace <b>/</b> Overview
          </span>
          <span className="environment">
            <i /> LOCAL PREVIEW
          </span>
        </header>
        <div className="dashboard-content">
          <p className="eyebrow">MONDAY, A GOOD DAY TO BEGIN</p>
          <h1>A little overview.</h1>
          <p className="dashboard-intro">
            The quiet beginning of your cafe workspace. More tools will find their place here.
          </p>
          <div className="dashboard-grid">
            {cards.map((card) => (
              <article className="metric-card" key={card.label}>
                <div>
                  <span>{card.label}</span>
                  <i>{card.icon}</i>
                </div>
                <strong>{card.value}</strong>
                <p>{card.note}</p>
              </article>
            ))}
          </div>
          <article className="welcome-card" id="menu">
            <div className="welcome-copy">
              <p className="eyebrow">A THOUGHTFUL FIRST STEP</p>
              <h2>
                Built for the
                <br />
                <em>everyday lovely.</em>
              </h2>
              <p>
                This Phase 1 admin shell is ready for future operations. No orders, customer
                information, or live cafe data are connected.
              </p>
              <span className="status-pill">
                <i /> Foundation ready
              </span>
            </div>
            <div className="welcome-art" aria-hidden="true">
              <span className="art-sun" />
              <span className="art-cup">
                <i />
              </span>
              <span className="art-saucer" />
            </div>
          </article>
          <footer className="dashboard-footer">
            HEARTH & HILL <span>·</span> A LITTLE ROOM TO SLOW DOWN
          </footer>
        </div>
      </section>
    </main>
  );
}
