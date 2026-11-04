import type { MenuItem } from '@cafe/shared';

const formatPrice = (priceCents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(priceCents / 100);

export function MenuSection({ items }: { items: MenuItem[] }) {
  return (
    <section className="menu-section section-wrap" id="menu" aria-labelledby="menu-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <span /> Made with a little more care
          </p>
          <h2 id="menu-title">
            Good things,
            <br />
            <em>made slowly.</em>
          </h2>
        </div>
        <p className="section-intro">
          Thoughtful cups, warm-from-the-oven treats, and small comforts for the everyday. Made
          here, with ingredients we feel good about.
        </p>
      </div>
      {items.length > 0 ? (
        <div className="menu-grid">
          {items.map((item, index) => (
            <article className={`menu-card menu-card-${index + 1}`} key={item.id}>
              <div className="menu-card-top">
                <span className="menu-number">0{index + 1}</span>
                <span className="menu-category">{item.category}</span>
              </div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="menu-card-bottom">
                <span>{item.tags[0] ?? 'made with care'}</span>
                <strong>{formatPrice(item.priceCents)}</strong>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="menu-note">Our menu is being prepared. Please check back soon.</p>
      )}
      {items.length > 0 && (
        <p className="menu-note">A little different every day. Ask us what’s fresh.</p>
      )}
    </section>
  );
}
