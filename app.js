/* =========================================================
   Steigenberger Immobilien — App Logic
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initNavToggle();
  initSmoothAnchors();
  initReveal();
  initCounters();
  initProperties();
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
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#' || id === '#top') return;
      const target = document.querySelector(id);
      if (!target) return;
      // Let legal-link handler manage modal targets separately.
      if (anchor.id === 'impressum' || anchor.id === 'datenschutz') return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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
    title: 'Lichtdurchflutete Altbauwohnung',
    location: 'Schwabing, München',
    price: 745000,
    type: 'kaufen',
    tag: 'Neu',
    rooms: 3.5,
    area: 98,
    colors: ['#2a3c65', '#14213d'],
  },
  {
    title: 'Modernes Reihenhaus mit Garten',
    location: 'Starnberg',
    price: 1180000,
    type: 'kaufen',
    tag: 'Neu',
    rooms: 5,
    area: 165,
    colors: ['#3a5a80', '#14213d'],
  },
  {
    title: 'Penthouse mit Dachterrasse',
    location: 'Bogenhausen, München',
    price: 2450000,
    type: 'kaufen',
    tag: 'Exklusiv',
    rooms: 4,
    area: 175,
    colors: ['#1c2a4a', '#0f1a30'],
  },
  {
    title: 'Helle 2-Zimmer-Wohnung',
    location: 'Sendling, München',
    price: 1450,
    type: 'mieten',
    tag: 'Reserviert',
    rooms: 2,
    area: 62,
    colors: ['#4a6285', '#233457'],
  },
  {
    title: 'Familienhaus mit Doppelgarage',
    location: 'Germering',
    price: 890000,
    type: 'kaufen',
    tag: null,
    rooms: 6,
    area: 190,
    colors: ['#2a3c65', '#0f1a30'],
  },
  {
    title: 'Loft-Wohnung im Industrial-Stil',
    location: 'Haidhausen, München',
    price: 2200,
    type: 'mieten',
    tag: 'Neu',
    rooms: 3,
    area: 88,
    colors: ['#3a5a80', '#1c2a4a'],
  },
  {
    title: 'Gepflegte Gewerbefläche',
    location: 'Innenstadt, München',
    price: 3800,
    type: 'mieten',
    tag: null,
    rooms: 1,
    area: 210,
    colors: ['#1c2a4a', '#14213d'],
  },
  {
    title: 'Villa mit Seeblick',
    location: 'Ammersee',
    price: 3650000,
    type: 'kaufen',
    tag: 'Exklusiv',
    rooms: 7,
    area: 320,
    colors: ['#233457', '#0f1a30'],
  },
  {
    title: 'Charmante Maisonette-Wohnung',
    location: 'Pasing, München',
    price: 1690,
    type: 'mieten',
    tag: null,
    rooms: 3,
    area: 76,
    colors: ['#4a6285', '#2a3c65'],
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

  return `
    <article class="card property-card reveal in-view" data-type="${property.type}">
      <div class="property-media" style="--pc1:${property.colors[0]};--pc2:${property.colors[1]}">
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
      </div>
    </article>
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

  render('alle');
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
      <p><strong>Steigenberger Immobilien GmbH</strong><br>
      Maximilianstraße 12, 80539 München</p>
      <p>Vertreten durch: Anna Steigenberger (Geschäftsführung)</p>
      <p>Telefon: +49 89 123 456 78<br>E-Mail: info@steigenberger-immobilien.de</p>
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
      unter info@steigenberger-immobilien.de.</p>
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
