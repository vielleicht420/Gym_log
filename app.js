/* =========================================================
   Winfried Immobilien — App Logic
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initNavToggle();
  initSmoothAnchors();
  initReveal();
  initCounters();
  initProperties();
  initPropertyPage();
  initTestimonialSlider();
  initAccordion();
  initContactForm();
  initNewsletterForm();
  initHeroSearch();
  initBackToTop();
  initLegalModal();
  initFooterYear();
});

/* ---------- Header shrink on scroll + progress bar ---------- */
function initHeader() {
  const header = document.getElementById('siteHeader');
  const progressBar = document.getElementById('progressBar');

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- Mobile nav toggle ---------- */
function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---------- Smooth scroll for in-page anchors ---------- */
function initSmoothAnchors() {
  // Delegated so it also handles anchors injected later (e.g. inside the property page).
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const id = anchor.getAttribute('href');
    if (!id || id === '#') return;
    // Let legal-link handler manage modal targets separately.
    if (anchor.id === 'impressum' || anchor.id === 'datenschutz') return;

    if (id === '#top') {
      e.preventDefault();
      closePropertyPage();
      history.replaceState(null, '', '#top');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closePropertyPage();
    history.replaceState(null, '', id);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* ---------- Scroll reveal animation ---------- */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in-view'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  items.forEach((el) => observer.observe(el));
}

/* ---------- Animated stat counters ---------- */
function initCounters() {
  const counters = document.querySelectorAll('.stat-num');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const duration = 1400;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target).toString();
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!('IntersectionObserver' in window)) {
    counters.forEach(animate);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => observer.observe(el));
}

/* ---------- Property listings ---------- */
const PROPERTIES = [
  {
    id: 'schwabing-altbau',
    title: 'Lichtdurchflutete Altbauwohnung',
    location: 'Schwabing, München',
    price: 745000,
    type: 'kaufen',
    tag: 'Neu',
    rooms: 3.5,
    area: 98,
    colors: ['#b2502b', '#1b1812'],
    description: [
      'Stilvolle Altbauwohnung mit hohen Decken, Stuckelementen und Dielenboden in gefragter Lage nahe der Leopoldstraße.',
    ],
  },
  {
    id: 'starnberg-reihenhaus',
    title: 'Modernes Reihenhaus mit Garten',
    location: 'Starnberg',
    price: 1180000,
    type: 'kaufen',
    tag: 'Neu',
    rooms: 5,
    area: 165,
    colors: ['#c97a4a', '#1b1812'],
    description: [
      'Familienfreundliches Reihenhaus mit privatem Garten, offener Wohnküche und kurzer Anbindung an den S-Bahnhof Starnberg.',
    ],
  },
  {
    id: 'bogenhausen-penthouse',
    title: 'Penthouse mit Dachterrasse',
    location: 'Bogenhausen, München',
    price: 2450000,
    type: 'kaufen',
    tag: 'Exklusiv',
    rooms: 4,
    area: 175,
    colors: ['#8a3d1e', '#1b1812'],
    description: [
      'Exklusives Penthouse mit umlaufender Dachterrasse und Blick über die Isarauen, hochwertig ausgestattet mit Fußbodenheizung und Smart-Home-Technik.',
    ],
  },
  {
    id: 'sendling-2zi',
    title: 'Helle 2-Zimmer-Wohnung',
    location: 'Sendling, München',
    price: 1450,
    type: 'mieten',
    tag: 'Reserviert',
    rooms: 2,
    area: 62,
    colors: ['#4b5842', '#1b1812'],
    description: [
      'Ruhige 2-Zimmer-Wohnung mit Südbalkon, Einbauküche und guter Anbindung an die U3.',
    ],
  },
  {
    id: 'germering-familienhaus',
    title: 'Familienhaus mit Doppelgarage',
    location: 'Germering',
    price: 890000,
    type: 'kaufen',
    tag: null,
    rooms: 6,
    area: 190,
    colors: ['#b2502b', '#3a3327'],
    description: [
      'Geräumiges Familienhaus mit Doppelgarage, Garten und Kellergeschoss in kinderfreundlicher Wohnlage.',
    ],
  },
  {
    id: 'haidhausen-loft',
    title: 'Loft-Wohnung im Industrial-Stil',
    location: 'Haidhausen, München',
    price: 2200,
    type: 'mieten',
    tag: 'Neu',
    rooms: 3,
    area: 88,
    colors: ['#c97a4a', '#3a3327'],
    description: [
      'Loft-Wohnung mit Betondecken, großen Fensterfronten und offenem Grundriss in zentraler Lage nahe dem Gasteig.',
    ],
  },
  {
    id: 'innenstadt-gewerbe',
    title: 'Gepflegte Gewerbefläche',
    location: 'Innenstadt, München',
    price: 3800,
    type: 'mieten',
    tag: null,
    rooms: 1,
    area: 210,
    colors: ['#1b1812', '#4b5842'],
    description: [
      'Repräsentative Gewerbefläche mit Schaufensterfront, ideal für Einzelhandel oder Showroom in bester Innenstadtlage.',
    ],
  },
  {
    id: 'ammersee-villa',
    title: 'Villa mit Seeblick',
    location: 'Ammersee',
    price: 3650000,
    type: 'kaufen',
    tag: 'Exklusiv',
    rooms: 7,
    area: 320,
    colors: ['#8a3d1e', '#3a3327'],
    description: [
      'Freistehende Villa mit direktem Seeblick, großzügigem Grundstück und privatem Bootssteg am Ammersee.',
    ],
  },
  {
    id: 'haar-eglfing-maisonette',
    title: 'Charmante Maisonettewohnung mit Dachterrasse',
    location: 'Haar-Eglfing',
    price: 590000,
    type: 'kaufen',
    tag: 'Neu',
    rooms: 3,
    area: 84,
    photo: 'images/haar-eglfing-exterior.jpg',
    address: 'Tassilostraße 6, 85540 Haar',
    pricePerSqm: '7.024 €/m²',
    commission: 'Keine Provision für Käufer',
    description: [
      'Diese gepflegte 3-Zimmer-Maisonettewohnung aus dem Baujahr 2008 erstreckt sich über zwei Etagen und bietet auf 84 m² ein modernes und komfortables Wohngefühl. Die offene Einbauküche mit hochwertigen Fronten, Granitarbeitsplatte, Dunstabzugshaube und praktischer Frühstücksbar ist ein echtes Highlight. Der großzügige, lichtdurchflutete Wohnbereich mit hellem Parkettboden lädt zum Wohlfühlen ein und bietet direkten Zugang zur sonnigen Dachterrasse mit schönem Ausblick ins Grüne – perfekt zum Entspannen und Genießen. Das gepflegte Badezimmer mit Dusche und WC sowie ein separates Gäste-WC runden das Raumangebot ab. Ein Aufzug im Gebäude sorgt ebenfalls für zusätzlichen Komfort.',
      'Im Kaufpreis inbegriffen ist ein Tiefgaragen-Einzelstellplatz im Wert von 15.000 €. Ein Energieausweis liegt vor. Die Wohnung ist zeitnah bezugsfrei. Die Wohnung ist aktuell noch voll möbliert. Die Einbauküche kann bei Interesse kostenlos übernommen werden.',
    ],
    lage:
      'Die Wohnung befindet sich in Haar-Eglfing, einer ruhigen und grünen Wohnsiedlung mit gepflegter Außenanlage – und das direkt vor den Toren Münchens. Haar überzeugt mit einer hervorragenden Infrastruktur: Einkaufsmöglichkeiten, Schulen, Ärzte und Freizeitangebote sind alle in unmittelbarer Nähe. Die S-Bahn (S6 und S4) bringt Sie schnell und bequem in die Münchner Innenstadt – ideal für Berufspendler und Stadtliebhaber gleichermaßen.',
    facts: [
      { label: 'Wohnungstyp', value: 'Maisonette' },
      { label: 'Nutzfläche ca.', value: '84 m²' },
      { label: 'Etage', value: '2' },
      { label: 'Etagenanzahl', value: '3' },
      { label: 'Schlafzimmer', value: '2' },
      { label: 'Badezimmer', value: '1' },
      { label: 'Gäste-WC', value: 'Ja' },
      { label: 'Balkon / Terrasse', value: 'Ja' },
      { label: 'Personenaufzug', value: 'Ja' },
      { label: 'Einbauküche', value: 'Ja' },
      { label: 'Garage / Stellplatz', value: 'Tiefgarage (1 Stellplatz)' },
    ],
    costs: [
      { label: 'Provision für Käufer', value: 'Nein' },
      { label: 'Preis pro m²', value: '7.024 €/m²' },
      { label: 'Qualität der Ausstattung', value: 'Normal' },
      { label: 'Energieausweis', value: 'Vorhanden' },
    ],
  },
];

function formatPrice(property) {
  const formatted = new Intl.NumberFormat('de-DE').format(property.price);
  return property.type === 'mieten'
    ? `${formatted} € <small>/ Monat</small>`
    : `${formatted} €`;
}

function propertyCardHTML(property) {
  const badgeClass = property.type === 'mieten' ? 'tag-mieten' : '';
  const badgeLabel = property.type === 'mieten' ? 'Mieten' : 'Kaufen';
  const extraTag = property.tag
    ? `<span class="property-tag">${property.tag}</span>`
    : '';
  const mediaStyle = property.photo
    ? ''
    : ` data-initial="${property.location.charAt(0)}" style="--pc1:${property.colors[0]};--pc2:${property.colors[1]}"`;
  const mediaContent = property.photo
    ? `<img src="${property.photo}" alt="${property.title}">`
    : '';

  return `
    <article class="card property-card reveal in-view" data-type="${property.type}" data-id="${property.id}" tabindex="0" role="button" aria-haspopup="dialog">
      <div class="property-media"${mediaStyle}>
        ${mediaContent}
        <span class="property-badge ${badgeClass}">${badgeLabel}</span>
        ${extraTag}
      </div>
      <div class="property-body">
        <p class="property-price">${formatPrice(property)}</p>
        <h3 class="property-title">${property.title}</h3>
        <p class="property-loc">${property.location}</p>
        <div class="property-meta">
          <span>🛏 ${property.rooms} Zimmer</span>
          <span>📐 ${property.area} m²</span>
        </div>
        <p class="property-details-link">Details ansehen &rarr;</p>
      </div>
    </article>
  `;
}

function propertyPageHTML(property) {
  const facts =
    property.facts ||
    [
      { label: 'Objekttyp', value: property.type === 'mieten' ? 'Mietobjekt' : 'Kaufobjekt' },
      { label: 'Wohnfläche ca.', value: `${property.area} m²` },
      { label: 'Zimmer', value: `${property.rooms}` },
    ];

  const factsHTML = facts
    .map((f) => `<li><span>${f.label}</span><strong>${f.value}</strong></li>`)
    .join('');

  const costsHTML = property.costs
    ? `<h2>Kosten</h2><ul class="detail-facts">${property.costs
        .map((c) => `<li><span>${c.label}</span><strong>${c.value}</strong></li>`)
        .join('')}</ul>`
    : '';

  const lageHTML = property.lage ? `<h2>Lage</h2><p>${property.lage}</p>` : '';

  const addressHTML = property.address
    ? `<p class="detail-address">📍 ${property.address}</p>`
    : '';

  const media = property.photo
    ? `<img src="${property.photo}" alt="${property.title}">`
    : `<div class="property-media" data-initial="${property.location.charAt(0)}" style="--pc1:${property.colors[0]};--pc2:${property.colors[1]}"></div>`;

  const badgeLabel = property.type === 'mieten' ? 'Mieten' : 'Kaufen';

  return `
    <a href="#immobilien" class="property-back">&larr; Zurück zu allen Immobilien</a>

    <div class="property-hero-media">${media}</div>

    <div class="property-page-grid">
      <div class="property-page-main">
        <span class="eyebrow">${badgeLabel}${property.tag ? ' · ' + property.tag : ''}</span>
        <h1>${property.title}</h1>
        <p class="detail-loc">${property.location}</p>
        ${addressHTML}

        <h2>Objektbeschreibung</h2>
        ${(property.description || []).map((p) => `<p>${p}</p>`).join('')}

        ${lageHTML}
      </div>

      <aside class="property-page-side">
        <div class="property-side-card">
          <p class="detail-price">${formatPrice(property)}</p>
          <ul class="detail-facts">${factsHTML}</ul>
          ${costsHTML}
          <a href="#kontakt" class="btn btn-primary detail-cta">Besichtigung anfragen</a>
          <div class="side-contact-row">
            <a href="tel:+498912345678" class="btn btn-outline side-contact-btn">Anruf</a>
            <a href="mailto:info@winfried-immobilien.de" class="btn btn-outline side-contact-btn">E-Mail</a>
          </div>
        </div>
      </aside>
    </div>
  `;
}

function initProperties() {
  const grid = document.getElementById('propertyGrid');
  const tabs = document.getElementById('filterTabs');
  if (!grid || !tabs) return;

  const render = (filter) => {
    const items =
      filter === 'alle' ? PROPERTIES : PROPERTIES.filter((p) => p.type === filter);
    grid.innerHTML = items.map(propertyCardHTML).join('');
  };

  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    tabs.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    render(btn.dataset.filter);
  });

  const openCard = (card) => {
    if (card.dataset.id) location.hash = 'immobilie-' + card.dataset.id;
  };

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.property-card');
    if (card) openCard(card);
  });

  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.property-card');
    if (!card) return;
    e.preventDefault();
    openCard(card);
  });

  render('alle');
}

/* ---------- Property detail page ---------- */
const DEFAULT_TITLE = document.title;
const ROUTE_PREFIX = 'immobilie-';

function showPropertyPage(property) {
  const main = document.querySelector('main');
  const page = document.getElementById('propertyPage');
  const body = document.getElementById('propertyPageBody');
  if (!main || !page || !body) return;

  body.innerHTML = propertyPageHTML(property);
  main.hidden = true;
  page.hidden = false;
  page.classList.remove('is-visible');
  window.scrollTo(0, 0);
  document.title = `${property.title} – Winfried Immobilien`;

  // Double rAF: lets the browser paint the initial (hidden→shown) state
  // before adding the class that triggers the transition.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      page.classList.add('is-visible');
    });
  });
}

function closePropertyPage() {
  const main = document.querySelector('main');
  const page = document.getElementById('propertyPage');
  if (!page || page.hidden) return;
  page.hidden = true;
  if (main) main.hidden = false;
  document.title = DEFAULT_TITLE;
}

function syncPropertyRoute() {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash.startsWith(ROUTE_PREFIX)) {
    const property = PROPERTIES.find((p) => p.id === hash.slice(ROUTE_PREFIX.length));
    if (property) {
      showPropertyPage(property);
      return;
    }
  }
  closePropertyPage();
}

function initPropertyPage() {
  window.addEventListener('hashchange', syncPropertyRoute);
  syncPropertyRoute();
}

/* ---------- Testimonial slider ---------- */
function initTestimonialSlider() {
  const track = document.getElementById('testimonialTrack');
  const dotsWrap = document.getElementById('testimonialDots');
  if (!track || !dotsWrap) return;

  const slides = track.children.length;
  let index = 0;
  let timer = null;

  for (let i = 0; i < slides; i++) {
    const dot = document.createElement('button');
    if (i === 0) dot.classList.add('active');
    dot.setAttribute('aria-label', `Bewertung ${i + 1} anzeigen`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  }

  function goTo(i) {
    index = (i + slides) % slides;
    track.style.transform = `translateX(-${index * 100}%)`;
    [...dotsWrap.children].forEach((d, di) => d.classList.toggle('active', di === index));
  }

  function startAutoplay() {
    timer = setInterval(() => goTo(index + 1), 5500);
  }

  const slider = document.getElementById('testimonialSlider');
  slider.addEventListener('mouseenter', () => clearInterval(timer));
  slider.addEventListener('mouseleave', startAutoplay);

  startAutoplay();
}

/* ---------- FAQ accordion ---------- */
function initAccordion() {
  const accordion = document.getElementById('accordion');
  if (!accordion) return;

  accordion.querySelectorAll('.accordion-item').forEach((item) => {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      accordion.querySelectorAll('.accordion-item.open').forEach((openItem) => {
        openItem.classList.remove('open');
        openItem.querySelector('.accordion-panel').style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
}

/* ---------- Contact form ---------- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll('[required]').forEach((field) => {
      const wrapper = field.closest('.field') || field.closest('.checkbox-field');
      const filled =
        field.type === 'checkbox' ? field.checked : field.value.trim().length > 0;
      const emailOk =
        field.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);

      if (!filled || !emailOk) {
        valid = false;
        if (wrapper) wrapper.classList.add('error');
      } else if (wrapper) {
        wrapper.classList.remove('error');
      }
    });

    if (!valid) {
      success.hidden = true;
      return;
    }

    success.hidden = false;
    success.textContent = 'Vielen Dank! Wir melden uns innerhalb eines Werktags bei Ihnen.';
    form.reset();
    form.querySelectorAll('.field.error').forEach((f) => f.classList.remove('error'));
  });
}

/* ---------- Newsletter form ---------- */
function initNewsletterForm() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input');
    const button = form.querySelector('button');
    if (!input.value.trim()) return;
    const original = button.textContent;
    button.textContent = 'Danke!';
    input.value = '';
    setTimeout(() => (button.textContent = original), 2200);
  });
}

/* ---------- Hero search -> scrolls to contact with prefilled topic ---------- */
function initHeroSearch() {
  const form = document.getElementById('heroSearch');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('searchType').value;
    const location = document.getElementById('searchLocation').value.trim();

    const topicSelect = document.getElementById('topic');
    const messageField = document.getElementById('message');

    const labelMap = {
      kaufen: 'Immobilie kaufen',
      mieten: 'Immobilie mieten',
      verkaufen: 'Immobilie verkaufen',
    };

    if (topicSelect && labelMap[type]) topicSelect.value = labelMap[type];
    if (messageField && location) {
      messageField.value = `Ich interessiere mich für eine Immobilie in/bei "${location}".`;
    }

    document.getElementById('kontakt').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* ---------- Back to top button ---------- */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener(
    'scroll',
    () => btn.classList.toggle('visible', window.scrollY > 600),
    { passive: true }
  );

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------- Legal modal (Impressum / Datenschutz) ---------- */
const LEGAL_CONTENT = {
  impressum: {
    title: 'Impressum',
    html: `
      <p><strong>Winfried Immobilien GmbH</strong><br>
      Maximilianstraße 12, 80539 München</p>
      <p>Vertreten durch: Tim Winkler und Maximilian Seyfried (Geschäftsführung)</p>
      <p>Telefon: +49 89 123 456 78<br>E-Mail: info@winfried-immobilien.de</p>
      <p>Registergericht: Amtsgericht München · HRB (Beispiel)<br>
      USt-IdNr.: DE 000000000 (Beispiel)</p>
      <p>Diese Inhalte dienen als Platzhalter für eine Demo-Website und
      ersetzen keine rechtsverbindliche Anbieterkennzeichnung.</p>
    `,
  },
  datenschutz: {
    title: 'Datenschutzerklärung',
    html: `
      <p>Wir nehmen den Schutz Ihrer persönlichen Daten ernst und behandeln
      sie vertraulich entsprechend den gesetzlichen Datenschutzvorschriften.</p>
      <p>Die über das Kontaktformular übermittelten Daten werden ausschließlich
      zur Bearbeitung Ihrer Anfrage verwendet und nicht an Dritte weitergegeben.</p>
      <p>Diese Website verwendet keine Tracking- oder Analyse-Cookies. Für
      Auskunft, Berichtigung oder Löschung Ihrer Daten kontaktieren Sie uns
      unter info@winfried-immobilien.de.</p>
      <p>Diese Inhalte dienen als Platzhalter für eine Demo-Website.</p>
    `,
  },
};

function initLegalModal() {
  const modal = document.getElementById('legalModal');
  const modalBody = document.getElementById('modalBody');
  const closeBtn = document.getElementById('modalClose');
  const backdrop = document.getElementById('modalBackdrop');
  if (!modal) return;

  const open = (key) => {
    const content = LEGAL_CONTENT[key];
    if (!content) return;
    modalBody.innerHTML = `<h3>${content.title}</h3>${content.html}`;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
  };

  ['impressum', 'datenschutz'].forEach((key) => {
    document.querySelectorAll(`#${key}, a[href="#${key}"]`).forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        open(key);
      });
    });
  });

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) close();
  });
}

/* ---------- Footer year ---------- */
function initFooterYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear().toString();
}
