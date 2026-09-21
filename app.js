/* =========================================================
   Winfried Immobilien — App Logic
   ========================================================= */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initNavToggle();
  initSmoothAnchors();
  initReveal();
  initTeamPhotoScrollColor();
  initCounters();
  initHeroIntro();
  initScrollIndicator();
  initAboutParallax();
  initTimeline();
  initProperties();
  initPropertyPage();
  initPropertyMedia();
  initTestimonialSlider();
  initTestimonialFilter();
  initAccordion();
  initContactForm();
  initNewsletterForm();
  initHeroSearch();
  initBackToTop();
  initSideContactTab();
  initContactPanel();
  initLegalModal();
  initCookieBanner();
  initMapEmbed();
  initFooterYear();
  initRegions();
  initSellerChecklist();
  initFirstMeetingPrefill();
});

/* ---------- Header shrink on scroll + progress bar + light/dark theme ---------- */
function updateHeaderState() {
  const header = document.getElementById('siteHeader');
  const hero = document.getElementById('heroSection');
  const progressBar = document.getElementById('progressBar');
  if (!header) return;

  header.classList.toggle('scrolled', window.scrollY > 40);

  // getBoundingClientRect() collapses to all-zero when the hero (or an
  // ancestor, e.g. <main> while the property page is open) isn't rendered —
  // so this naturally turns off on-dark styling on the property page too.
  const heroVisible = !!hero && hero.getBoundingClientRect().bottom > header.offsetHeight;
  header.classList.toggle('on-dark', heroVisible);

  if (progressBar) {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
  }
}

function initHeader() {
  window.addEventListener('scroll', updateHeaderState, { passive: true });
  window.addEventListener('resize', updateHeaderState);
  updateHeaderState();
}

/* ---------- Mobile nav toggle ---------- */
function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  const overlay = document.getElementById('navOverlay');

  const closeNav = () => {
    nav.classList.remove('open');
    toggle.classList.remove('open');
    overlay?.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
    overlay?.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  overlay?.addEventListener('click', closeNav);

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
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

    // Leaving the property detail page or the valuation wizard (e.g.
    // "Zurück zu allen Immobilien", "Abbrechen") lands on a different part
    // of the page than where the user currently is, since those overlays
    // always open scrolled to their own top — an animated smooth scroll
    // there just plays a long, disorienting scroll through unrelated
    // sections instead of a clean "go back". Jump straight there, the
    // same way opening the page itself does.
    const leavingOverlayPage = !!anchor.closest('#propertyPage, #valuationPage');

    if (id === '#top') {
      e.preventDefault();
      closePropertyPage();
      closeValuationPage();
      history.replaceState(null, '', '#top');
      window.scrollTo({ top: 0, behavior: leavingOverlayPage ? 'instant' : 'smooth' });
      return;
    }

    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closePropertyPage();
    closeValuationPage();
    history.replaceState(null, '', id);
    target.scrollIntoView({ behavior: leavingOverlayPage ? 'instant' : 'smooth', block: 'start' });
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

/* ---------- Team photos: colour in on scroll (touch devices only) ----------
   On desktop the photos colour in on :hover (CSS). Touch devices have no
   hover, so instead the photo colours in while it's in view and fades
   back to grayscale once it scrolls away — reversible, unlike .reveal. */
function initTeamPhotoScrollColor() {
  if (!window.matchMedia('(hover: none)').matches) return;
  const photos = document.querySelectorAll('.team-photo');
  if (!photos.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('in-frame', entry.isIntersecting);
      });
    },
    { threshold: 0.55 }
  );
  photos.forEach((el) => observer.observe(el));
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

/* ---------- Hero entrance animation ---------- */
function initHeroIntro() {
  const hero = document.getElementById('heroSection');
  if (!hero) return;
  // Reduced motion is handled purely in CSS (elements are shown instantly);
  // the class is still added so no JS branch is needed elsewhere.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => hero.classList.add('hero-loaded'));
  });
}

/* ---------- Scroll indicator ---------- */
function initScrollIndicator() {
  const btn = document.getElementById('scrollIndicator');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const target = document.getElementById('leistungen');
    if (target) target.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'start' });
  });
}

/* ---------- Subtle parallax on the about photo ---------- */
function initAboutParallax() {
  if (REDUCED_MOTION) return;
  const photo = document.querySelector('.about-photo');
  if (!photo) return;
  const images = photo.querySelectorAll('img');
  if (!images.length) return;

  let ticking = false;

  const update = () => {
    ticking = false;
    const rect = photo.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const elementCenter = rect.top + rect.height / 2;
    const offset = Math.max(Math.min((viewportCenter - elementCenter) * 0.06, 16), -16);
    images.forEach((img) => { img.style.transform = `translateY(${offset}px) scale(1.06)`; });
  };

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}

/* ---------- Ablauf timeline: progressive line + active step ---------- */
function initTimeline() {
  const timeline = document.getElementById('timeline');
  const fill = document.getElementById('timelineFill');
  if (!timeline || !fill) return;
  const items = [...timeline.querySelectorAll('.timeline-item')];

  if (REDUCED_MOTION) {
    fill.style.transform = 'scaleY(1)';
    items.forEach((item) => item.classList.add('active'));
    return;
  }

  const REF_OFFSET = 170; // px from viewport top, clears the fixed header
  let ticking = false;

  const update = () => {
    ticking = false;
    const rect = timeline.getBoundingClientRect();
    const progress = Math.min(Math.max((REF_OFFSET - rect.top) / rect.height, 0), 1);
    fill.style.transform = `scaleY(${progress})`;

    let activeIndex = -1;
    items.forEach((item, i) => {
      const marker = item.querySelector('.timeline-marker');
      if (marker && marker.getBoundingClientRect().top <= REF_OFFSET) activeIndex = i;
    });
    items.forEach((item, i) => item.classList.toggle('active', i === activeIndex));
  };

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}

/* ---------- Property listings ---------- */
const PROPERTIES = [
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
    gallery: [
      { src: 'images/haar-eglfing-treppenhaus.jpg', alt: 'Treppenhaus zur Maisonette-Ebene' },
      { src: 'images/haar-eglfing-wohnzimmer.jpg', alt: 'Wohnbereich mit Parkettboden' },
      { src: 'images/haar-eglfing-wohnzimmer-terrasse.jpg', alt: 'Wohnbereich mit Zugang zur Dachterrasse' },
      { src: 'images/haar-eglfing-bad.jpg', alt: 'Badezimmer mit Dusche und WC' },
    ],
    address: 'Tassilostraße 6, 85540 Haar',
    pricePerSqm: '7.024 €/m²',
    commission: 'Keine Provision für Käufer',
    description: [
      'Diese gepflegte 3-Zimmer-Maisonettewohnung aus dem Baujahr 2008 erstreckt sich über zwei Etagen und bietet auf 84 m² ein modernes und komfortables Wohngefühl. Die offene Einbauküche mit hochwertigen Fronten, Granitarbeitsplatte, Dunstabzugshaube und praktischer Frühstücksbar ist ein echtes Highlight. Der großzügige, lichtdurchflutete Wohnbereich mit hellem Parkettboden lädt zum Wohlfühlen ein und bietet direkten Zugang zur sonnigen Dachterrasse mit schönem Ausblick ins Grüne – perfekt zum Entspannen und Genießen. Das gepflegte Badezimmer mit Dusche und WC sowie ein separates Gäste-WC runden das Raumangebot ab. Ein Aufzug im Gebäude sorgt ebenfalls für zusätzlichen Komfort.',
      'Im Kaufpreis inbegriffen ist ein Tiefgaragen-Einzelstellplatz im Wert von 15.000 €. Ein Energieausweis liegt vor. Die Wohnung ist zeitnah bezugsfrei. Die Wohnung ist aktuell noch voll möbliert. Die Einbauküche kann bei Interesse kostenlos übernommen werden.',
    ],
    highlights: [
      'Dachterrasse mit direktem Zugang vom Wohnbereich',
      'Tiefgaragen-Stellplatz im Kaufpreis inbegriffen',
      'Hochwertige Einbauküche mit Granitarbeitsplatte',
      'Personenaufzug im Gebäude',
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
  {
    id: 'schwabing-altbau',
    title: 'Lichtdurchflutete Altbauwohnung',
    location: 'Schwabing, München',
    price: 745000,
    type: 'kaufen',
    tag: 'Neu',
    rooms: 3.5,
    area: 98,
    photo: 'images/altbau-schwabing.jpg',
    colors: ['#b2502b', '#1b1812'],
    description: [
      'Stilvolle Altbauwohnung mit hohen Decken, Stuckelementen und Dielenboden in gefragter Lage nahe der Leopoldstraße.',
    ],
    highlights: ['Hohe Decken und Stuckelemente', 'Dielenboden im Altbau-Charakter', 'Nahe der Leopoldstraße'],
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
    photo: 'images/penthouse-bogenhausen.jpg',
    colors: ['#8a3d1e', '#1b1812'],
    description: [
      'Exklusives Penthouse mit umlaufender Dachterrasse und Blick über die Isarauen, hochwertig ausgestattet mit Fußbodenheizung und Smart-Home-Technik.',
    ],
    highlights: ['Umlaufende Dachterrasse mit Blick über die Isarauen', 'Fußbodenheizung', 'Smart-Home-Technik'],
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
    photo: 'images/loft-haidhausen.jpg',
    colors: ['#c97a4a', '#3a3327'],
    description: [
      'Loft-Wohnung mit großen Fensterfronten und offenem Grundriss in zentraler Lage nahe dem Gasteig.',
    ],
    highlights: ['Große Fensterfronten', 'Offener Grundriss', 'Nähe zum Gasteig'],
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
    highlights: ['Privater Garten', 'Offene Wohnküche', 'Kurze Anbindung an den S-Bahnhof Starnberg'],
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
    highlights: ['Südbalkon', 'Einbauküche', 'Gute Anbindung an die U3'],
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
    highlights: ['Doppelgarage', 'Garten', 'Kellergeschoss'],
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
    highlights: ['Schaufensterfront', 'Beste Innenstadtlage', 'Ideal für Einzelhandel oder Showroom'],
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
    photo: 'images/villa-ammersee.jpg',
    colors: ['#8a3d1e', '#3a3327'],
    description: [
      'Freistehende Villa mit direktem Seeblick, großzügigem Grundstück und privatem Bootssteg am Ammersee.',
    ],
    highlights: ['Direkter Seeblick', 'Privater Bootssteg', 'Großzügiges Grundstück'],
  },
];

function formatPrice(property) {
  const formatted = new Intl.NumberFormat('de-DE').format(property.price);
  return property.type === 'mieten'
    ? `${formatted} € <small>/ Monat</small>`
    : `${formatted} €`;
}

function formatRooms(rooms) {
  return String(rooms).replace('.', ',');
}

function propertyCardHTML(property, featured = false) {
  const badgeClass = property.type === 'mieten' ? 'tag-mieten' : '';
  const badgeLabel = property.type === 'mieten' ? 'Mieten' : 'Kaufen';
  const extraTag = property.tag
    ? `<span class="property-tag">${property.tag}</span>`
    : '';
  const mediaStyle = property.photo
    ? ''
    : ` data-initial="${property.location.charAt(0)}" style="--pc1:${property.colors[0]};--pc2:${property.colors[1]}"`;
  const mediaContent = property.photo
    ? `<img src="${property.photo}" alt="${property.title}" loading="lazy">`
    : '';
  const featuredClass = featured ? ' featured' : '';

  return `
    <article class="card property-card${featuredClass} reveal in-view" data-type="${property.type}" data-id="${property.id}" tabindex="0" role="button" aria-haspopup="dialog">
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
          <span>${formatRooms(property.rooms)} Zimmer</span>
          <span>${property.area} m²</span>
        </div>
        <p class="property-details-link">Details ansehen <span class="arrow">&rarr;</span></p>
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
      { label: 'Zimmer', value: formatRooms(property.rooms) },
    ];

  const factsHTML = facts
    .map((f) => `<li><span>${f.label}</span><strong>${f.value}</strong></li>`)
    .join('');

  const costsHTML = property.costs
    ? `<h2>Kosten</h2><ul class="detail-facts">${property.costs
        .map((c) => `<li><span>${c.label}</span><strong>${c.value}</strong></li>`)
        .join('')}</ul>`
    : '';

  const highlightsHTML = property.highlights
    ? `<h2>Highlights</h2><ul class="detail-highlights">${property.highlights
        .map((h) => `<li>${h}</li>`)
        .join('')}</ul>`
    : '';

  const lageHTML = property.lage ? `<h2>Lage</h2><p>${property.lage}</p>` : '';

  const addressHTML = property.address
    ? `<p class="detail-address">${property.address}</p>`
    : '';

  const heroImages = property.photo
    ? [{ src: property.photo, alt: property.title }, ...(property.gallery || [])]
    : [];

  const media = heroImages.length
    ? `
      <div class="hero-slider-track">
        ${heroImages.map((img) => `<img src="${img.src}" alt="${img.alt}">`).join('')}
      </div>
      ${
        heroImages.length > 1
          ? `<button type="button" class="hero-slider-nav hero-slider-prev" aria-label="Vorheriges Bild">&larr;</button>
             <button type="button" class="hero-slider-nav hero-slider-next" aria-label="Nächstes Bild">&rarr;</button>
             <span class="hero-slider-counter">1 / ${heroImages.length}</span>`
          : ''
      }
      <button type="button" class="hero-expand-btn" aria-label="Bild vergrößern">&#10530;</button>
    `
    : `<div class="property-media" data-initial="${property.location.charAt(0)}" style="--pc1:${property.colors[0]};--pc2:${property.colors[1]}"></div>`;

  const badgeLabel = property.type === 'mieten' ? 'Mieten' : 'Kaufen';

  return `
    <a href="#immobilien" class="property-back">&larr; Zurück zu allen Immobilien</a>

    <div class="property-hero-media" data-index="0">${media}</div>

    <div class="property-page-grid">
      <div class="property-page-main">
        <span class="eyebrow">${badgeLabel}${property.tag ? ' · ' + property.tag : ''}</span>
        <h1>${property.title}</h1>
        <p class="detail-loc">${property.location}</p>
        ${addressHTML}

        <h2>Objektbeschreibung</h2>
        ${(property.description || []).map((p) => `<p>${p}</p>`).join('')}

        ${highlightsHTML}
        ${lageHTML}
      </div>

      <aside class="property-page-side">
        <div class="property-side-card">
          <p class="detail-price">${formatPrice(property)}</p>
          <p class="detail-facts-label">Ausstattung</p>
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

// Shared property search/filter state, driven by both the filter tabs on the
// Immobilien section and the hero search form.
const activePropertyFilters = { type: 'alle', location: '', budget: null };

function getFilteredProperties() {
  return PROPERTIES.filter((p) => {
    if (activePropertyFilters.type !== 'alle' && p.type !== activePropertyFilters.type) return false;
    if (activePropertyFilters.location && !p.location.toLowerCase().includes(activePropertyFilters.location.toLowerCase())) {
      return false;
    }
    if (activePropertyFilters.budget && p.price > activePropertyFilters.budget) return false;
    return true;
  });
}

function renderPropertyResults() {
  const grid = document.getElementById('propertyGrid');
  const countEl = document.getElementById('propertyResultsCount');
  if (!grid) return;

  const items = getFilteredProperties();
  const hasExtraFilters = !!activePropertyFilters.location || !!activePropertyFilters.budget;

  if (countEl) {
    if (items.length === 0) {
      countEl.innerHTML = `Keine passenden Objekte gefunden. Nicht das Richtige dabei? <a href="#kontakt">Wir finden auch abseits der Kartei etwas Passendes für Sie.</a>` +
        (hasExtraFilters ? ` <button type="button" class="property-filter-reset" id="propertyFilterReset">Filter zurücksetzen</button>` : '');
    } else {
      const noun = items.length === 1 ? 'passende Immobilie' : 'passende Immobilien';
      countEl.innerHTML = `<strong>${items.length}</strong> ${noun} gefunden` +
        (hasExtraFilters ? ` <button type="button" class="property-filter-reset" id="propertyFilterReset">Filter zurücksetzen</button>` : '');
    }
  }

  if (items.length < 3) {
    grid.innerHTML = items.map((p) => propertyCardHTML(p)).join('');
  } else {
    const [first, second, third, ...rest] = items;
    const featureRow = `
      <div class="property-feature-row">
        ${propertyCardHTML(first, true)}
        <div class="property-feature-side">
          ${propertyCardHTML(second)}
          ${propertyCardHTML(third)}
        </div>
      </div>
    `;
    grid.innerHTML = featureRow + rest.map((p) => propertyCardHTML(p)).join('');
  }

  document.getElementById('propertyFilterReset')?.addEventListener('click', () => {
    activePropertyFilters.type = 'alle';
    activePropertyFilters.location = '';
    activePropertyFilters.budget = null;
    document.querySelectorAll('#filterTabs .filter-btn').forEach((b) => b.classList.toggle('active', b.dataset.filter === 'alle'));
    renderPropertyResults();
  });
}

function initProperties() {
  const grid = document.getElementById('propertyGrid');
  const tabs = document.getElementById('filterTabs');
  if (!grid || !tabs) return;

  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    tabs.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activePropertyFilters.type = btn.dataset.filter;
    renderPropertyResults();
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

  renderPropertyResults();
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
  // Explicit 'instant' overrides the global CSS scroll-behavior:smooth —
  // otherwise this reset itself plays out as a visible smooth-scroll-up
  // before the page's own fade-in ever becomes visible.
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.title = `${property.title} – Winfried Immobilien`;
  updateHeaderState();

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
  updateHeaderState();
}

function syncPropertyRoute() {
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash.startsWith(ROUTE_PREFIX)) {
    const property = PROPERTIES.find((p) => p.id === hash.slice(ROUTE_PREFIX.length));
    if (property) {
      closeValuationPage();
      showPropertyPage(property);
      return;
    }
  }
  if (hash === VALUATION_ROUTE) {
    closePropertyPage();
    showValuationPage();
    return;
  }
  closePropertyPage();
  closeValuationPage();
}

function initPropertyPage() {
  window.addEventListener('hashchange', syncPropertyRoute);
  syncPropertyRoute();
}

/* ---------- Kostenlose Bewertung: multi-step wizard ---------- */
const VALUATION_ROUTE = 'bewertung';
const VALUATION_STEP_COUNT = 4;
const VALUATION_TYPES = [
  { value: 'eg-wohnung', label: 'EG-Wohnung' },
  { value: 'etagenwohnung', label: 'Etagenwohnung' },
  { value: 'maisonette', label: 'Maisonette' },
  { value: 'dg-wohnung', label: 'DG-Wohnung' },
  { value: 'haus', label: 'Haus' },
  { value: 'grundstueck', label: 'Grundstück' },
];

let valuationStep = 1;
let valuationState = {};

const VALUATION_HAUS_TYPES = [
  { value: 'einfamilienhaus', label: 'Einfamilienhaus' },
  { value: 'doppelhaushaelfte', label: 'Doppelhaushälfte' },
  { value: 'reihenhaus', label: 'Reihenhaus' },
  { value: 'mehrfamilienhaus', label: 'Mehrfamilienhaus' },
];

function resetValuationState() {
  valuationStep = 1;
  valuationState = {
    anliegen: '',
    typ: '',
    flaeche: '',
    grundstueck: '',
    zimmer: '',
    baujahr: '',
    etage: '',
    hausart: '',
    adresse: '',
    name: '',
    email: '',
    telefon: '',
  };
}

function valuationChoiceCard(value, label, current, subtitle) {
  return `<button type="button" class="valuation-choice${
    current === value ? ' selected' : ''
  }" data-value="${value}">${label}${
    subtitle ? `<span class="valuation-choice-sub">${subtitle}</span>` : ''
  }</button>`;
}

function valuationProgressHTML(step) {
  return `
    <div class="valuation-progress">
      <div class="valuation-progress-bar"><span style="width:${(step / VALUATION_STEP_COUNT) * 100}%"></span></div>
      <p class="valuation-progress-label">Schritt ${step} von ${VALUATION_STEP_COUNT}</p>
    </div>
  `;
}

function valuationStepHTML() {
  const exitLink = `<a href="#top" class="property-back">&larr; Abbrechen</a>`;

  if (valuationStep === 1) {
    return `
      ${exitLink}
      ${valuationProgressHTML(1)}
      <h2>Was möchten Sie wissen?</h2>
      <div class="valuation-choices">
        ${valuationChoiceCard('kaufpreis', 'Kaufpreis', valuationState.anliegen, 'Möglicher Verkaufspreis Ihrer Immobilie')}
        ${valuationChoiceCard('mietpreis', 'Mietpreis', valuationState.anliegen, 'Realistische Mieteinschätzung')}
      </div>
    `;
  }

  if (valuationStep === 2) {
    return `
      ${exitLink}
      ${valuationProgressHTML(2)}
      <h2>Um welchen Immobilientyp handelt es sich?</h2>
      <div class="valuation-choices valuation-choices-grid">
        ${VALUATION_TYPES.map((t) => valuationChoiceCard(t.value, t.label, valuationState.typ)).join('')}
      </div>
      <div class="valuation-nav">
        <button type="button" class="btn btn-outline valuation-back">&larr; Zurück</button>
      </div>
    `;
  }

  if (valuationStep === 3) {
    const typ = valuationState.typ;
    const isHaus = typ === 'haus';
    const isGrundstueck = typ === 'grundstueck';

    const addressField = `
      <div class="field valuation-field-wide">
        <label for="valAdresse">Adresse (Straße, PLZ, Ort) *</label>
        <input type="text" id="valAdresse" value="${valuationState.adresse}" required>
        <p class="field-error-msg">Bitte geben Sie die Adresse an.</p>
        <p class="valuation-hint">Die Lage ist ein wesentlicher Faktor für die Immobilienbewertung.</p>
      </div>
    `;

    let fieldsHTML;

    if (isGrundstueck) {
      fieldsHTML = `
        <div class="field valuation-field-wide">
          <label for="valGrundstueck">Grundstücksfläche ca. (m²) *</label>
          <input type="number" id="valGrundstueck" min="1" value="${valuationState.grundstueck}" required>
          <p class="field-error-msg">Bitte geben Sie die Grundstücksfläche an.</p>
        </div>
        ${addressField}
      `;
    } else if (isHaus) {
      fieldsHTML = `
        <div class="field">
          <label for="valFlaeche">Wohnfläche ca. (m²) *</label>
          <input type="number" id="valFlaeche" min="1" value="${valuationState.flaeche}" required>
          <p class="field-error-msg">Bitte geben Sie die Wohnfläche an.</p>
        </div>
        <div class="field">
          <label for="valGrundstueck">Grundstücksfläche ca. (m²)</label>
          <input type="number" id="valGrundstueck" min="1" value="${valuationState.grundstueck}">
        </div>
        <div class="field">
          <label for="valZimmer">Zimmer *</label>
          <input type="number" id="valZimmer" min="1" step="0.5" value="${valuationState.zimmer}" required>
          <p class="field-error-msg">Bitte geben Sie die Zimmeranzahl an.</p>
        </div>
        <div class="field">
          <label for="valBaujahr">Baujahr</label>
          <input type="number" id="valBaujahr" min="1800" max="2030" value="${valuationState.baujahr}">
        </div>
        <div class="field valuation-field-wide">
          <label for="valHausart">Hausart</label>
          <select id="valHausart">
            <option value="">Bitte wählen (optional)</option>
            ${VALUATION_HAUS_TYPES.map(
              (h) => `<option value="${h.value}"${valuationState.hausart === h.value ? ' selected' : ''}>${h.label}</option>`
            ).join('')}
          </select>
        </div>
        ${addressField}
      `;
    } else {
      fieldsHTML = `
        <div class="field">
          <label for="valFlaeche">Wohnfläche ca. (m²) *</label>
          <input type="number" id="valFlaeche" min="1" value="${valuationState.flaeche}" required>
          <p class="field-error-msg">Bitte geben Sie die Wohnfläche an.</p>
        </div>
        <div class="field">
          <label for="valZimmer">Zimmer *</label>
          <input type="number" id="valZimmer" min="1" step="0.5" value="${valuationState.zimmer}" required>
          <p class="field-error-msg">Bitte geben Sie die Zimmeranzahl an.</p>
        </div>
        <div class="field">
          <label for="valBaujahr">Baujahr</label>
          <input type="number" id="valBaujahr" min="1800" max="2030" value="${valuationState.baujahr}">
        </div>
        <div class="field">
          <label for="valEtage">Etage</label>
          <input type="number" id="valEtage" min="0" max="60" value="${valuationState.etage}">
        </div>
        ${addressField}
      `;
    }

    return `
      ${exitLink}
      ${valuationProgressHTML(3)}
      <h2>Angaben zur Immobilie</h2>
      <div class="valuation-form-grid">
        ${fieldsHTML}
      </div>
      <div class="valuation-nav">
        <button type="button" class="btn btn-outline valuation-back">&larr; Zurück</button>
        <button type="button" class="btn btn-primary valuation-next">Weiter <span class="arrow">&rarr;</span></button>
      </div>
    `;
  }

  if (valuationStep === 4) {
    return `
      ${exitLink}
      ${valuationProgressHTML(4)}
      <h2>Ihre Kontaktdaten</h2>
      <form id="valuationForm" novalidate>
        <div class="valuation-form-grid">
          <div class="field">
            <label for="valName">Name *</label>
            <input type="text" id="valName" value="${valuationState.name}" required>
            <p class="field-error-msg">Bitte geben Sie Ihren Namen ein.</p>
          </div>
          <div class="field">
            <label for="valEmail">E-Mail *</label>
            <input type="email" id="valEmail" value="${valuationState.email}" required>
            <p class="field-error-msg">Bitte geben Sie eine gültige E-Mail-Adresse ein.</p>
          </div>
          <div class="field valuation-field-wide">
            <label for="valPhone">Telefon</label>
            <input type="tel" id="valPhone" value="${valuationState.telefon}">
          </div>
        </div>
        <label class="checkbox-field">
          <input type="checkbox" id="valConsent" required>
          <span>Ich habe die <a href="#datenschutz">Datenschutzerklärung</a> zur Kenntnis genommen. *</span>
        </label>
        <p class="valuation-error" id="valuationError" hidden>Bitte füllen Sie alle Pflichtfelder korrekt aus.</p>
        <div class="valuation-nav">
          <button type="button" class="btn btn-outline valuation-back">&larr; Zurück</button>
          <button type="submit" class="btn btn-primary valuation-submit">Bewertung anfordern <span class="arrow">&rarr;</span></button>
        </div>
      </form>
    `;
  }

  // Step 5: success
  return `
    <div class="valuation-success">
      <h2>Vielen Dank!</h2>
      <p>Wir haben Ihre Angaben erhalten. Ihre Immobilie wird nun persönlich von uns geprüft.
        Anschließend melden wir uns mit einer ersten Einschätzung bei Ihnen.</p>
      <a href="#top" class="btn btn-primary">Zur Startseite</a>
    </div>
  `;
}

// The site footer is hidden while the valuation wizard is on steps 1–4, so
// the black footer never appears below a short step. It's shown again on
// the success step (step 5) and whenever the wizard is closed.
function updateValuationFooterVisibility() {
  const footer = document.querySelector('.site-footer');
  const page = document.getElementById('valuationPage');
  if (!footer || !page) return;
  footer.hidden = !page.hidden && valuationStep < 5;
}

function renderValuationStep() {
  const body = document.getElementById('valuationBody');
  if (!body) return;

  const applyStep = () => {
    body.innerHTML = valuationStepHTML();
    bindValuationStepEvents();
    updateValuationFooterVisibility();
    // Always land at the top of the new step — otherwise a scroll
    // position carried over from the previous step (e.g. from a click
    // that had to scroll a card into view) can leave the page looking
    // mid-scroll.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        body.classList.remove('valuation-step-out');
      });
    });
  };

  if (REDUCED_MOTION || !body.hasChildNodes()) {
    applyStep();
    return;
  }

  body.classList.add('valuation-step-out');
  window.setTimeout(applyStep, 160);
}

function bindValuationStepEvents() {
  const body = document.getElementById('valuationBody');
  if (!body) return;

  body.querySelectorAll('.valuation-choice').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (valuationStep === 1) valuationState.anliegen = btn.dataset.value;
      if (valuationStep === 2) valuationState.typ = btn.dataset.value;
      valuationStep += 1;
      renderValuationStep();
    });
  });

  body.querySelector('.valuation-back')?.addEventListener('click', () => {
    valuationStep -= 1;
    renderValuationStep();
  });

  body.querySelector('.valuation-next')?.addEventListener('click', () => {
    const typ = valuationState.typ;
    const isHaus = typ === 'haus';
    const isGrundstueck = typ === 'grundstueck';

    const adresse = document.getElementById('valAdresse');
    const adresseOk = !!adresse.value.trim();
    adresse.setAttribute('aria-invalid', adresseOk ? 'false' : 'true');
    adresse.closest('.field')?.classList.toggle('error', !adresseOk);

    let valid = adresseOk;
    let flaeche, zimmer, grundstueck;

    if (isGrundstueck) {
      grundstueck = document.getElementById('valGrundstueck');
      const grundstueckOk = Number(grundstueck.value) > 0;
      grundstueck.setAttribute('aria-invalid', grundstueckOk ? 'false' : 'true');
      grundstueck.closest('.field')?.classList.toggle('error', !grundstueckOk);
      valid = valid && grundstueckOk;
    } else {
      flaeche = document.getElementById('valFlaeche');
      zimmer = document.getElementById('valZimmer');
      const flaecheOk = Number(flaeche.value) > 0;
      const zimmerOk = Number(zimmer.value) > 0;
      flaeche.setAttribute('aria-invalid', flaecheOk ? 'false' : 'true');
      zimmer.setAttribute('aria-invalid', zimmerOk ? 'false' : 'true');
      flaeche.closest('.field')?.classList.toggle('error', !flaecheOk);
      zimmer.closest('.field')?.classList.toggle('error', !zimmerOk);
      valid = valid && flaecheOk && zimmerOk;

      if (isHaus) grundstueck = document.getElementById('valGrundstueck');
    }

    if (!valid) return;

    valuationState.adresse = adresse.value;

    if (isGrundstueck) {
      valuationState.grundstueck = grundstueck.value;
    } else {
      valuationState.flaeche = flaeche.value;
      valuationState.zimmer = zimmer.value;
      valuationState.baujahr = document.getElementById('valBaujahr').value;
      if (isHaus) {
        valuationState.grundstueck = grundstueck.value;
        valuationState.hausart = document.getElementById('valHausart').value;
      } else {
        valuationState.etage = document.getElementById('valEtage').value;
      }
    }

    valuationStep += 1;
    renderValuationStep();
  });

  const form = document.getElementById('valuationForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('valName');
    const email = document.getElementById('valEmail');
    const phone = document.getElementById('valPhone');
    const consent = document.getElementById('valConsent');
    const error = document.getElementById('valuationError');
    const submitBtn = form.querySelector('.valuation-submit');

    const nameOk = !!name.value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
    const valid = nameOk && emailOk && consent.checked;
    name.setAttribute('aria-invalid', nameOk ? 'false' : 'true');
    email.setAttribute('aria-invalid', emailOk ? 'false' : 'true');
    name.closest('.field')?.classList.toggle('error', !nameOk);
    email.closest('.field')?.classList.toggle('error', !emailOk);
    consent.closest('.checkbox-field')?.classList.toggle('error', !consent.checked);
    error.hidden = true;

    if (!valid) {
      const firstInvalid = form.querySelector('.field.error input, .checkbox-field.error input');
      firstInvalid?.focus();
      error.hidden = false;
      error.textContent =
        nameOk && emailOk && !consent.checked
          ? 'Bitte bestätigen Sie die Datenschutzerklärung.'
          : 'Bitte füllen Sie alle Pflichtfelder korrekt aus.';
      return;
    }

    valuationState.name = name.value;
    valuationState.email = email.value;
    valuationState.telefon = phone.value;

    const originalLabel = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird gesendet …';

    try {
      const typeLabel = VALUATION_TYPES.find((t) => t.value === valuationState.typ)?.label || valuationState.typ;
      const anliegenLabel = valuationState.anliegen === 'mietpreis' ? 'Mietpreis' : 'Kaufpreis';
      const fd = new FormData();
      fd.append('_subject', 'Neue Online-Bewertung – Winfried Immobilien');
      fd.append('name', valuationState.name);
      fd.append('email', valuationState.email);
      fd.append('telefon', valuationState.telefon);
      fd.append('anliegen', anliegenLabel);
      fd.append('immobilientyp', typeLabel);
      if (valuationState.flaeche) fd.append('wohnflaeche', `${valuationState.flaeche} m²`);
      if (valuationState.grundstueck) fd.append('grundstuecksflaeche', `${valuationState.grundstueck} m²`);
      if (valuationState.zimmer) fd.append('zimmer', valuationState.zimmer);
      if (valuationState.baujahr) fd.append('baujahr', valuationState.baujahr);
      if (valuationState.etage) fd.append('etage', valuationState.etage);
      if (valuationState.hausart) {
        const hausartLabel = VALUATION_HAUS_TYPES.find((h) => h.value === valuationState.hausart)?.label;
        fd.append('hausart', hausartLabel || valuationState.hausart);
      }
      fd.append('adresse', valuationState.adresse);

      const response = await fetch('https://formspree.io/f/myezkkbq', {
        method: 'POST',
        body: fd,
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        valuationStep = 5;
        renderValuationStep();
      } else {
        let detail = '';
        try {
          const data = await response.json();
          detail = (data.errors || []).map((err) => err.message).join(', ');
        } catch {
          /* response wasn't JSON — fall back to the generic message below */
        }
        console.error('Formspree submission failed:', response.status, detail);
        error.hidden = false;
        error.textContent = detail
          ? `Ihre Anfrage konnte leider nicht gesendet werden: ${detail}`
          : 'Ihre Anfrage konnte leider nicht gesendet werden. Bitte versuchen Sie es erneut.';
      }
    } catch (err) {
      console.error('Formspree submission network error:', err);
      error.hidden = false;
      error.textContent = 'Ihre Anfrage konnte leider nicht gesendet werden. Bitte versuchen Sie es erneut.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
    }
  });
}

function showValuationPage() {
  const main = document.querySelector('main');
  const page = document.getElementById('valuationPage');
  if (!main || !page) return;

  resetValuationState();
  document.getElementById('valuationBody').innerHTML = '';
  main.hidden = true;
  page.hidden = false;
  renderValuationStep();
  page.classList.remove('is-visible');
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.title = 'Kostenlose Bewertung – Winfried Immobilien';
  updateHeaderState();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      page.classList.add('is-visible');
    });
  });
}

function closeValuationPage() {
  const main = document.querySelector('main');
  const page = document.getElementById('valuationPage');
  if (!page || page.hidden) return;
  page.hidden = true;
  if (main) main.hidden = false;
  document.title = DEFAULT_TITLE;
  updateHeaderState();
  updateValuationFooterVisibility();
}

/* ---------- Testimonial slider ---------- */
function initTestimonialSlider() {
  const track = document.getElementById('testimonialTrack');
  const counter = document.getElementById('testimonialCounter');
  const prevBtn = document.getElementById('testimonialPrev');
  const nextBtn = document.getElementById('testimonialNext');
  const slider = document.getElementById('testimonialSlider');
  if (!track || !counter || !slider) return;

  let index = 0;
  let timer = null;

  const pad = (n) => String(n).padStart(2, '0');

  // Recomputed on every call rather than captured once, so this keeps
  // working correctly after the testimonial filter replaces the track's
  // content with a smaller subset.
  function goTo(i) {
    const slides = track.children.length;
    if (!slides) return;
    index = (i + slides) % slides;
    track.style.transform = `translateX(-${index * 100}%)`;
    counter.innerHTML = `<strong>${pad(index + 1)}</strong> / ${pad(slides)}`;
  }

  function startAutoplay() {
    clearInterval(timer);
    if (REDUCED_MOTION) return; // no automatic slider motion under reduced motion
    timer = setInterval(() => goTo(index + 1), 5500);
  }
  function stopAutoplay() {
    clearInterval(timer);
  }

  prevBtn?.addEventListener('click', () => { goTo(index - 1); startAutoplay(); });
  nextBtn?.addEventListener('click', () => { goTo(index + 1); startAutoplay(); });

  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);

  // Touch swipe support
  let touchStartX = null;
  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    stopAutoplay();
  }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) goTo(dx < 0 ? index + 1 : index - 1);
    touchStartX = null;
    startAutoplay();
  });

  goTo(0);
  startAutoplay();

  // Exposed so the category filter can jump back to the start and restart
  // autoplay over a freshly-rendered subset, without re-registering all
  // the listeners above a second time.
  track._resetSlider = () => { goTo(0); startAutoplay(); };
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
  const error = document.getElementById('formError');
  const submitBtn = form?.querySelector('.form-submit');
  if (!form || !submitBtn) return;

  const submitLabel = submitBtn.innerHTML;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll('[required]').forEach((field) => {
      const wrapper = field.closest('.field') || field.closest('.checkbox-field');
      const filled =
        field.type === 'checkbox' ? field.checked : field.value.trim().length > 0;
      const emailOk =
        field.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);

      const fieldValid = filled && emailOk;
      field.setAttribute('aria-invalid', fieldValid ? 'false' : 'true');

      if (!fieldValid) {
        valid = false;
        if (wrapper) wrapper.classList.add('error');
      } else if (wrapper) {
        wrapper.classList.remove('error');
      }
    });

    success.hidden = true;
    error.hidden = true;

    if (!valid) {
      const firstError = form.querySelector('.field.error input, .field.error select, .field.error textarea');
      firstError?.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird gesendet …';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        success.hidden = false;
        form.reset();
        form.querySelectorAll('.field.error').forEach((f) => f.classList.remove('error'));
        form.querySelectorAll('[aria-invalid]').forEach((f) => f.setAttribute('aria-invalid', 'false'));
      } else {
        console.error('Formspree submission failed:', response.status, await response.text());
        error.hidden = false;
      }
    } catch (err) {
      console.error('Formspree submission network error:', err);
      error.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitLabel;
    }
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

/* ---------- Hero search -> real property search, or the valuation wizard for sellers ---------- */
function initHeroSearch() {
  const form = document.getElementById('heroSearch');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('searchType').value;
    const locationQuery = document.getElementById('searchLocation').value.trim();
    const budget = document.getElementById('searchBudget').value;

    // "Verkaufen" means the visitor wants to sell, not browse listings —
    // there's nothing to search for, so send them straight to the real
    // valuation flow instead of an empty/irrelevant results view.
    if (type === 'verkaufen') {
      location.hash = VALUATION_ROUTE;
      return;
    }

    activePropertyFilters.type = type;
    activePropertyFilters.location = locationQuery;
    activePropertyFilters.budget = budget ? Number(budget) : null;

    document.querySelectorAll('#filterTabs .filter-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.filter === type);
    });
    renderPropertyResults();

    history.replaceState(null, '', '#immobilien');
    document.getElementById('immobilien')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

/* ---------- Side contact tab ---------- */
function initSideContactTab() {
  const tab = document.getElementById('sideContactTab');
  if (!tab) return;

  let lastY = window.scrollY;
  let idleTimer = null;

  window.addEventListener(
    'scroll',
    () => {
      const currentY = window.scrollY;
      const scrollingDown = currentY > lastY + 2;
      // Slide out only while actively scrolling down; once the scroll settles
      // (no more scroll events for a moment), bring it back regardless of
      // which direction that last scroll was — it should always end up visible.
      tab.classList.toggle('is-hidden', scrollingDown && currentY > 80);
      lastY = currentY;

      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => tab.classList.remove('is-hidden'), 200);
    },
    { passive: true }
  );
}

/* ---------- Contact panel (opened from the side contact tab) ---------- */
function initContactPanel() {
  const trigger = document.getElementById('sideContactTab');
  const panel = document.getElementById('contactPanel');
  if (!trigger || !panel) return;

  const closeBtn = document.getElementById('contactPanelClose');
  const scrim = panel.querySelector('.contact-panel-backdrop');

  const open = () => {
    panel.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => panel.classList.add('is-visible'));
    });
  };

  const close = () => {
    panel.classList.remove('is-visible');
    document.body.style.overflow = '';
    window.setTimeout(() => { panel.hidden = true; }, 350);
  };

  // Open the panel instead of the tab's #kontakt fallback link — stopping
  // propagation keeps the delegated anchor-scroll handler from also firing.
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    open();
  });

  closeBtn.addEventListener('click', close);
  scrim.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) close();
  });
}

/* ---------- Cookie consent ---------- */
const COOKIE_CONSENT_KEY = 'cookieConsent';

function getCookieConsent() {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY);
  } catch {
    return null;
  }
}

function setCookieConsent(value) {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch {
    /* localStorage unavailable (e.g. private mode) */
  }
  document.dispatchEvent(new CustomEvent('cookieconsentchange', { detail: value }));
}

function initCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('cookieAccept');
  const declineBtn = document.getElementById('cookieDecline');
  if (!banner || !acceptBtn || !declineBtn) return;

  const openBanner = () => {
    banner.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('open')));
  };

  const closeBanner = () => {
    banner.classList.remove('open');
    setTimeout(() => {
      banner.hidden = true;
    }, 350);
  };

  if (!getCookieConsent()) openBanner();

  acceptBtn.addEventListener('click', () => {
    setCookieConsent('accepted');
    closeBanner();
  });

  declineBtn.addEventListener('click', () => {
    setCookieConsent('declined');
    closeBanner();
  });

  document.querySelectorAll('.cookie-settings-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openBanner();
    });
  });
}

function initMapEmbed() {
  const placeholder = document.getElementById('mapPlaceholder');
  if (!placeholder) return;

  let loaded = false;
  const loadMap = () => {
    if (loaded) return;
    loaded = true;
    const iframe = document.createElement('iframe');
    iframe.src =
      'https://maps.google.com/maps?q=Maximilianstra%C3%9Fe%2012%2C%2080539%20M%C3%BCnchen&output=embed';
    iframe.title = 'Standort Winfried Immobilien auf der Karte';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    placeholder.replaceWith(iframe);
  };

  document.addEventListener('cookieconsentchange', (e) => {
    if (e.detail === 'accepted') loadMap();
  });

  if (getCookieConsent() === 'accepted') loadMap();
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
      <p><strong>Kontaktformular:</strong> Die über das Kontaktformular
      übermittelten Daten werden zur Bearbeitung Ihrer Anfrage an unseren
      Formular-Dienstleister Formspree, Inc. übertragen und verarbeitet.
      Eine Weitergabe an sonstige Dritte findet nicht statt.</p>
      <p><strong>Schriftarten:</strong> Diese Website bindet Schriftarten
      lokal ein. Es findet keine Verbindung zu externen Schriftarten-Anbietern
      statt, sodass hierbei keine Daten an Dritte übertragen werden.</p>
      <p><strong>Google Maps:</strong> Im Kontaktbereich bieten wir eine
      Kartenansicht von Google Maps an. Diese wird erst nach Ihrer
      ausdrücklichen Zustimmung geladen. Wird die Karte geladen, überträgt
      Ihr Browser Daten (u.a. Ihre IP-Adresse) an Google LLC und es können
      Cookies gesetzt werden. Weitere Informationen finden Sie in den
      Datenschutzhinweisen von Google unter
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a>.
      Ihre Zustimmung können Sie jederzeit über den Link
      „Cookie-Einstellungen" im Footer widerrufen bzw. erneut erteilen.
      Unabhängig von Ihrer Zustimmung können Sie den Standort auch jederzeit
      über die Links "In Google Maps öffnen" bzw. "In Apple Maps öffnen"
      in einem neuen Tab aufrufen.</p>
      <p>Für Auskunft, Berichtigung oder Löschung Ihrer Daten kontaktieren
      Sie uns unter info@winfried-immobilien.de.</p>
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

/* ---------- Property hero slider + lightbox ---------- */
function initPropertyMedia() {
  const container = document.getElementById('propertyPageBody');
  const lightbox = document.getElementById('galleryLightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbCounter = document.getElementById('lightboxCounter');
  const closeBtn = document.getElementById('lightboxClose');
  const backdrop = document.getElementById('lightboxBackdrop');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  if (!container || !lightbox) return;

  let lbImages = [];
  let lbIndex = 0;

  const showLightboxImage = () => {
    const current = lbImages[lbIndex];
    lbImg.src = current.src;
    lbImg.alt = current.alt;
    lbCounter.textContent = `${lbIndex + 1} / ${lbImages.length}`;
  };

  const openLightbox = (images, startIndex) => {
    lbImages = images;
    lbIndex = startIndex;
    showLightboxImage();
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  };

  const stepLightbox = (delta) => {
    lbIndex = (lbIndex + delta + lbImages.length) % lbImages.length;
    showLightboxImage();
  };

  const goToSlide = (media, index) => {
    const track = media.querySelector('.hero-slider-track');
    if (!track) return;
    const total = track.children.length;
    const clamped = ((index % total) + total) % total;
    track.style.transform = `translateX(-${clamped * 100}%)`;
    media.dataset.index = clamped;
    const sliderCounter = media.querySelector('.hero-slider-counter');
    if (sliderCounter) sliderCounter.textContent = `${clamped + 1} / ${total}`;
  };

  container.addEventListener('click', (e) => {
    const media = e.target.closest('.property-hero-media');
    if (!media) return;

    if (e.target.closest('.hero-slider-prev')) {
      goToSlide(media, Number(media.dataset.index || 0) - 1);
      return;
    }
    if (e.target.closest('.hero-slider-next')) {
      goToSlide(media, Number(media.dataset.index || 0) + 1);
      return;
    }
    if (e.target.closest('.hero-expand-btn') || e.target.closest('.hero-slider-track img')) {
      const images = [...media.querySelectorAll('.hero-slider-track img')].map((el) => ({
        src: el.src,
        alt: el.alt,
      }));
      if (images.length) openLightbox(images, Number(media.dataset.index || 0));
    }
  });

  // Touch swipe support for the hero slider
  let touchStartX = null;
  container.addEventListener(
    'touchstart',
    (e) => {
      if (e.target.closest('.property-hero-media')) touchStartX = e.touches[0].clientX;
    },
    { passive: true }
  );
  container.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const media = e.target.closest('.property-hero-media');
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (media && Math.abs(dx) > 40) {
      goToSlide(media, Number(media.dataset.index || 0) + (dx < 0 ? 1 : -1));
    }
    touchStartX = null;
  });

  closeBtn.addEventListener('click', closeLightbox);
  backdrop.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', () => stepLightbox(-1));
  nextBtn.addEventListener('click', () => stepLightbox(1));

  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
  });
}

/* ---------- Footer year ---------- */
function initFooterYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear().toString();
}

/* ---------- Regions (München & Umgebung) ---------- */
const REGIONS = {
  schwabing: {
    label: 'Schwabing',
    text: 'Schwabing zählt zu den gefragtesten Altbaulagen Münchens – hohe Nachfrage bei Eigentumswohnungen, stabile Wertentwicklung und eine Käuferschaft, die Charakter und zentrale Lage schätzt.',
  },
  bogenhausen: {
    label: 'Bogenhausen',
    text: 'Bogenhausen steht für gehobenes Wohnen mit Villencharakter und guter Anbindung an die Isar – ein Stadtteil mit hoher Kaufkraft und entsprechend gefragtem Objektsegment.',
  },
  nymphenburg: {
    label: 'Nymphenburg',
    text: 'Nymphenburg verbindet großzügige Grundstücke und ruhige Wohnstraßen mit kurzen Wegen in die Innenstadt – ein Markt für Familien und langfristig orientierte Käufer:innen.',
  },
  solln: {
    label: 'Solln',
    text: 'Solln ist geprägt von freistehenden Einfamilienhäusern und Grundstücken in gewachsener Lage – gefragt bei Familien, die Ruhe und dennoch Stadtnähe suchen.',
  },
  gruenwald: {
    label: 'Grünwald',
    text: 'Grünwald gilt als eine der wertstabilsten Wohnlagen im Münchner Süden – große Grundstücke, hoher Diskretionsanspruch und ein Markt mit sehr geringer Fluktuation.',
  },
  pullach: {
    label: 'Pullach',
    text: 'Pullach bietet gehobenes Wohnen im Grünen mit direkter Isartal-Nähe – eine Lage, die zunehmend auch jüngere Familien mit höherem Budget anzieht.',
  },
  starnberg: {
    label: 'Starnberg',
    text: 'Starnberg profitiert von der Nähe zum See und der S-Bahn-Anbindung nach München – gefragt sowohl als Erstwohnsitz als auch für Kapitalanleger:innen.',
  },
};

function initRegions() {
  const chips = document.getElementById('regionChips');
  const detail = document.getElementById('regionDetail');
  if (!chips || !detail) return;

  const render = (key) => {
    const region = REGIONS[key];
    if (!region) return;

    const matches = PROPERTIES.filter((p) => p.location.toLowerCase().includes(region.label.toLowerCase()));
    const matchesHTML = matches.length
      ? `
        <p class="region-matches-label">Demo-Objekte aus dieser Lage</p>
        <div class="region-matches">${matches.map((p) => propertyCardHTML(p)).join('')}</div>
      `
      : `<p class="region-matches-label">Aktuell keine gelisteten Demo-Objekte in dieser Lage – <a href="#kontakt">sprechen Sie uns gerne an</a>.</p>`;

    detail.innerHTML = `
      <h3>${region.label}</h3>
      <p>${region.text}</p>
      ${matchesHTML}
    `;
  };

  chips.addEventListener('click', (e) => {
    const chip = e.target.closest('.region-chip');
    if (!chip) return;
    chips.querySelectorAll('.region-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    render(chip.dataset.region);
  });

  detail.addEventListener('click', (e) => {
    const card = e.target.closest('.property-card');
    if (card?.dataset.id) location.hash = 'immobilie-' + card.dataset.id;
  });

  detail.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.property-card');
    if (!card?.dataset.id) return;
    e.preventDefault();
    location.hash = 'immobilie-' + card.dataset.id;
  });

  render('schwabing');
}

/* ---------- Verkäufer-Checkliste ---------- */
const SELLER_CHECKLIST_ITEMS = [
  'Grundbuchauszug',
  'Grundriss',
  'Wohnflächenberechnung',
  'Energieausweis',
  'Bauunterlagen',
  'Wohn-/Nutzflächen',
  'Modernisierungen',
  'Nebenkosten / Hausgeld',
  'Teilungserklärung (bei Wohnung)',
];
const SELLER_CHECKLIST_KEY = 'sellerChecklistState';

function initSellerChecklist() {
  const list = document.getElementById('checklistItems');
  const fill = document.getElementById('checklistProgressFill');
  const label = document.getElementById('checklistProgressLabel');
  if (!list || !fill || !label) return;

  let checked = {};
  try {
    checked = JSON.parse(localStorage.getItem(SELLER_CHECKLIST_KEY)) || {};
  } catch {
    checked = {};
  }

  const updateProgress = () => {
    const total = SELLER_CHECKLIST_ITEMS.length;
    const done = SELLER_CHECKLIST_ITEMS.filter((_, i) => checked[i]).length;
    fill.style.width = `${(done / total) * 100}%`;
    label.textContent = `${done} von ${total} Punkten vorbereitet`;
  };

  list.innerHTML = SELLER_CHECKLIST_ITEMS.map(
    (item, i) => `
      <button type="button" class="checklist-item${checked[i] ? ' checked' : ''}" data-index="${i}">
        <span class="checklist-box" aria-hidden="true">${checked[i] ? '&#10003;' : ''}</span>
        <span class="checklist-label">${item}</span>
      </button>
    `
  ).join('');

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.checklist-item');
    if (!btn) return;
    const i = btn.dataset.index;
    checked[i] = !checked[i];
    btn.classList.toggle('checked', !!checked[i]);
    btn.querySelector('.checklist-box').innerHTML = checked[i] ? '&#10003;' : '';
    try {
      localStorage.setItem(SELLER_CHECKLIST_KEY, JSON.stringify(checked));
    } catch {
      /* localStorage unavailable (private mode etc.) — state just won't persist */
    }
    updateProgress();
  });

  updateProgress();
}

/* ---------- Testimonial category filter ---------- */
function initTestimonialFilter() {
  const tabs = document.getElementById('testimonialFilterTabs');
  const track = document.getElementById('testimonialTrack');
  if (!tabs || !track) return;

  // Keep the original markup so a filter can be reversed exactly, since
  // filtering replaces the track's content rather than just hiding items
  // (the slider positions slides by index, which hidden-but-present
  // elements would throw off).
  const allTestimonials = [...track.querySelectorAll('.testimonial')].map((el) => ({
    category: el.dataset.category,
    html: el.outerHTML,
  }));

  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    tabs.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    const filtered = filter === 'alle' ? allTestimonials : allTestimonials.filter((t) => t.category === filter);

    track.innerHTML = filtered.length
      ? filtered.map((t) => t.html).join('')
      : '<p class="testimonial-empty">Noch keine Bewertungen in dieser Kategorie.</p>';

    track._resetSlider?.();
  });
}

/* ---------- "Erstgespräch vereinbaren" -> prefill the contact form ---------- */
function initFirstMeetingPrefill() {
  const btn = document.querySelector('.js-first-meeting');
  const topicSelect = document.getElementById('topic');
  if (!btn || !topicSelect) return;

  btn.addEventListener('click', () => {
    topicSelect.value = 'Erstgespräch vereinbaren';
  });
}
