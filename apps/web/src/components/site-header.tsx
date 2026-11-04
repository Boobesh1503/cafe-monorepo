const links = [
  { href: '#menu', label: 'The menu' },
  { href: '#story', label: 'Our little corner' },
  { href: '#visit', label: 'Come by' },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Hearth and Hill Cafe home">
        <span className="brand-stamp" aria-hidden="true">
          h
        </span>
        <span className="brand-name">
          hearth <i>&</i> hill
        </span>
      </a>
      <nav className="main-nav" aria-label="Main navigation">
        {links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <a className="header-visit" href="#visit">
        Find your way <span aria-hidden="true">↗</span>
      </a>
    </header>
  );
}
