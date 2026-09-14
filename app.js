(function () {
  "use strict";

  var TOPICS = window.STUDY_DATA.topics;
  var STORAGE_KEY = "examTrainer:v1";
  var THEME_KEY = "examTrainer:theme";
  var DAY_MS = 24 * 60 * 60 * 1000;

  // ---------- Icons (no emoji, inline SVG) ----------
  var ICONS = {
    sun: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    moon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    auto: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    list: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    play: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>',
    cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="7" y1="7" x2="17" y2="17"/><line x1="17" y1="7" x2="7" y2="17"/></svg>',
    clock: '<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>'
  };

  // ---------- State ----------
  function loadState() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    if (!raw) return { cards: {}, quiz: {}, history: {}, favorites: {} };
    try {
      var parsed = JSON.parse(raw);
      return { cards: parsed.cards || {}, quiz: parsed.quiz || {}, history: parsed.history || {}, favorites: parsed.favorites || {} };
    } catch (e) {
      return { cards: {}, quiz: {}, history: {}, favorites: {} };
    }
  }

  var state = loadState();

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function cardState(id) {
    if (!state.cards[id]) {
      state.cards[id] = { ef: 2.5, interval: 0, reps: 0, due: 0, lapses: 0, seen: 0 };
    }
    return state.cards[id];
  }

  function quizStat(id) {
    if (!state.quiz[id]) {
      state.quiz[id] = { attempts: 0, correct: 0 };
    }
    return state.quiz[id];
  }

  function logActivity() {
    var key = new Date().toISOString().slice(0, 10);
    state.history = state.history || {};
    state.history[key] = (state.history[key] || 0) + 1;
    saveState();
  }

  function isFavorite(id) {
    return !!(state.favorites && state.favorites[id]);
  }

  function toggleFavorite(id) {
    state.favorites = state.favorites || {};
    if (state.favorites[id]) delete state.favorites[id];
    else state.favorites[id] = true;
    saveState();
  }

  function vibrate(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignore */ }
  }

  // ---------- Theme ----------
  function getThemePref() {
    try { return localStorage.getItem(THEME_KEY) || "system"; } catch (e) { return "system"; }
  }

  function applyTheme(pref) {
    if (pref === "light" || pref === "dark") document.documentElement.setAttribute("data-theme", pref);
    else document.documentElement.removeAttribute("data-theme");
  }

  function updateThemeButton() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var pref = getThemePref();
    btn.innerHTML = pref === "light" ? ICONS.sun : pref === "dark" ? ICONS.moon : ICONS.auto;
  }

  function setThemePref(pref) {
    try { localStorage.setItem(THEME_KEY, pref); } catch (e) { /* ignore */ }
    applyTheme(pref);
    updateThemeButton();
  }

  applyTheme(getThemePref());

  // ---------- Service worker (offline support) ----------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* offline support optional */ });
    });
  }

  // ---------- Spaced repetition (simplified SM-2) ----------
  function rateCard(id, rating) {
    var s = cardState(id);
    s.seen++;
    s.lastRating = rating;
    if (rating === 0) { // again
      s.reps = 0;
      s.interval = 0;
      s.ef = Math.max(1.3, s.ef - 0.2);
      s.lapses++;
    } else if (rating === 1) { // hard
      s.interval = Math.max(1, Math.round((s.interval || 1) * 1.2));
      s.ef = Math.max(1.3, s.ef - 0.15);
      s.reps++;
    } else if (rating === 2) { // good
      if (s.reps === 0) s.interval = 1;
      else if (s.reps === 1) s.interval = 6;
      else s.interval = Math.round(s.interval * s.ef);
      s.reps++;
    } else { // easy
      if (s.reps === 0) s.interval = 4;
      else s.interval = Math.round(s.interval * s.ef * 1.3);
      s.ef = s.ef + 0.15;
      s.reps++;
    }
    s.due = Date.now() + s.interval * DAY_MS;
    logActivity();
  }

  function allCards() {
    var out = [];
    TOPICS.forEach(function (t) {
      t.cards.forEach(function (c) { out.push(Object.assign({ topicId: t.id, topicTitle: t.title }, c)); });
    });
    return out;
  }

  function cardsForTopic(topicId) {
    var cards = allCards();
    if (topicId === "all") return cards;
    return cards.filter(function (c) { return c.topicId === topicId; });
  }

  function dueCards(topicId) {
    var now = Date.now();
    return cardsForTopic(topicId).filter(function (c) {
      var s = cardState(c.id);
      return s.due <= now;
    }).sort(function (a, b) { return cardState(a.id).due - cardState(b.id).due; });
  }

  function ratedCards(topicId, rating) {
    return cardsForTopic(topicId).filter(function (c) {
      var s = state.cards[c.id];
      return s && s.lastRating === rating;
    });
  }

  function favoriteCards(topicId) {
    return cardsForTopic(topicId).filter(function (c) { return isFavorite(c.id); });
  }

  function allQuiz() {
    var out = [];
    TOPICS.forEach(function (t) {
      t.quiz.forEach(function (q) { out.push(Object.assign({ topicId: t.id, topicTitle: t.title }, q)); });
    });
    return out;
  }

  function quizForTopic(topicId) {
    var qs = allQuiz();
    if (topicId === "all") return qs;
    return qs.filter(function (q) { return q.topicId === topicId; });
  }

  function wrongQuizQuestions(topicId) {
    return quizForTopic(topicId).filter(function (q) {
      var s = state.quiz[q.id];
      return s && s.lastCorrect === false;
    });
  }

  function rightQuizQuestions(topicId) {
    return quizForTopic(topicId).filter(function (q) {
      var s = state.quiz[q.id];
      return s && s.lastCorrect === true;
    });
  }

  function spawnConfetti(container) {
    if (!container) return;
    var colors = ["#b0824f", "#8a9662", "#94ad6a", "#d7a558", "#c9806a"];
    for (var i = 0; i < 26; i++) {
      var piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "%";
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.4 + "s";
      piece.style.transform = "rotate(" + Math.floor(Math.random() * 360) + "deg)";
      container.appendChild(piece);
    }
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function truncateText(str, n) {
    return str.length > n ? str.slice(0, n).trim() + "…" : str;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatTime(ms) {
    var totalSec = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function animateCount(el, target, suffix) {
    if (!el) return;
    var duration = 600;
    var startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      el.textContent = Math.round(progress * target) + (suffix || "");
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ---------- Search ----------
  var SEARCH_INDEX = allCards().map(function (c) {
    return { type: "card", topicTitle: c.topicTitle, primary: c.front, secondary: c.back };
  }).concat(allQuiz().map(function (q) {
    return { type: "quiz", topicTitle: q.topicTitle, primary: q.question, secondary: "Richtig: " + q.options[q.correct] };
  }));

  function renderSearchResults(query) {
    var resultsEl = document.getElementById("search-results");
    var q = query.trim().toLowerCase();
    if (!q) {
      resultsEl.innerHTML = '<div class="search-hint">Tippe, um in allen Karteikarten und Quizfragen zu suchen.</div>';
      return;
    }
    var matches = SEARCH_INDEX.filter(function (item) {
      return (item.primary + " " + item.secondary + " " + item.topicTitle).toLowerCase().indexOf(q) !== -1;
    }).slice(0, 40);
    if (!matches.length) {
      resultsEl.innerHTML = '<div class="search-hint">Keine Treffer für „' + query + '“.</div>';
      return;
    }
    resultsEl.innerHTML = matches.map(function (item) {
      return (
        '<div class="search-result-item">' +
        '<div class="search-result-type">' + (item.type === "card" ? "Karteikarte" : "Quiz") + " · " + item.topicTitle + "</div>" +
        '<div class="search-result-primary">' + item.primary + "</div>" +
        '<div class="search-result-secondary">' + item.secondary + "</div>" +
        "</div>"
      );
    }).join("");
  }

  var searchToggle = document.getElementById("search-toggle");
  var searchOverlay = document.getElementById("search-overlay");
  var searchInput = document.getElementById("search-input");
  var searchClose = document.getElementById("search-close");

  if (searchToggle) {
    searchToggle.addEventListener("click", function () {
      searchOverlay.hidden = false;
      searchInput.value = "";
      renderSearchResults("");
      setTimeout(function () { searchInput.focus(); }, 50);
    });
    searchClose.addEventListener("click", function () { searchOverlay.hidden = true; });
    searchOverlay.addEventListener("click", function (e) {
      if (e.target === searchOverlay) searchOverlay.hidden = true;
    });
    searchInput.addEventListener("input", function () { renderSearchResults(searchInput.value); });
  }

  // ---------- View router ----------
  var app = document.getElementById("app");
  var tabsNav = document.getElementById("tabs");
  var tabs = document.querySelectorAll(".tab-btn");
  var tabIndicator = document.getElementById("tab-indicator");
  var currentView = "home";

  function moveTabIndicator(btn, animate) {
    if (!tabIndicator || !btn || !tabsNav) return;
    var navRect = tabsNav.getBoundingClientRect();
    var btnRect = btn.getBoundingClientRect();
    if (!animate) tabIndicator.style.transition = "none";
    tabIndicator.style.width = btnRect.width + "px";
    tabIndicator.style.transform = "translateX(" + (btnRect.left - navRect.left) + "px)";
    if (!animate) {
      tabIndicator.getBoundingClientRect(); // force reflow before re-enabling transition
      tabIndicator.style.transition = "";
    }
  }

  tabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabs.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      currentView = btn.dataset.view;
      moveTabIndicator(btn, true);
      render();
    });
  });

  moveTabIndicator(document.querySelector(".tab-btn.active"), false);

  var resizeTimeout = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      moveTabIndicator(document.querySelector(".tab-btn.active"), false);
    }, 120);
  });

  var themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    updateThemeButton();
    themeToggle.addEventListener("click", function () {
      var order = ["system", "light", "dark"];
      var next = order[(order.indexOf(getThemePref()) + 1) % order.length];
      setThemePref(next);
    });
  }

  function render() {
    clearExamTimer();
    if (currentView === "home") renderHome();
    else if (currentView === "cards") renderCards();
    else if (currentView === "piles") renderPiles();
    else if (currentView === "quiz") renderQuiz();
    else if (currentView === "progress") renderProgress();
  }

  function goToView(view) {
    tabs.forEach(function (b) { b.classList.remove("active"); });
    var btn = document.querySelector('.tab-btn[data-view="' + view + '"]');
    if (btn) {
      btn.classList.add("active");
      moveTabIndicator(btn, true);
    }
    currentView = view;
    render();
  }

  function topicOptionsHTML(includeAll) {
    var html = includeAll ? '<option value="all">Alle Themen</option>' : "";
    TOPICS.forEach(function (t) {
      html += '<option value="' + t.id + '">' + t.title + "</option>";
    });
    return html;
  }

  // ---------- Home ----------
  function renderHome() {
    var tpl = document.getElementById("tpl-home");
    app.innerHTML = "";
    app.appendChild(tpl.content.cloneNode(true));

    var due = dueCards("all").length;
    var totalCards = allCards().length;
    var learned = Object.keys(state.cards).filter(function (id) { return state.cards[id].reps > 0; }).length;
    var quizAttempts = Object.values(state.quiz).reduce(function (s, q) { return s + q.attempts; }, 0);
    var quizCorrect = Object.values(state.quiz).reduce(function (s, q) { return s + q.correct; }, 0);
    var accuracy = quizAttempts > 0 ? Math.round((quizCorrect / quizAttempts) * 100) : 0;

    document.getElementById("home-stats").innerHTML = [
      statCard(learned + " / " + totalCards, "Karten gelernt"),
      animatedStatCard("stat-acc", "Quiz-Trefferquote", "%")
    ].join("");
    animateCount(document.getElementById("stat-acc"), accuracy, "%");

    var continueBtn = document.getElementById("home-continue");
    continueBtn.innerHTML = ICONS.play + "<span>Weiter lernen" + (due > 0 ? " (" + due + " fällig)" : "") + "</span>";
    continueBtn.addEventListener("click", function () {
      sessionStorage.setItem("cardsTopic", "all");
      goToView("cards");
    });

    var topicsHTML = TOPICS.map(function (t) {
      var cardIds = t.cards.map(function (c) { return c.id; });
      var learnedInTopic = cardIds.filter(function (id) { return state.cards[id] && state.cards[id].reps > 0; }).length;
      var pct = cardIds.length ? Math.round((learnedInTopic / cardIds.length) * 100) : 0;
      return (
        '<div class="topic-card topic-card-row">' +
        '<div class="topic-info">' +
        "<h4>" + t.title + "</h4>" +
        '<div class="meta">' + t.cards.length + " Karteikarten · " + t.quiz.length + " Quizfragen</div>" +
        "</div>" +
        '<div class="progress-ring" style="--pct:' + pct + '%"><div class="progress-ring-inner">' + pct + "%</div></div>" +
        "</div>"
      );
    }).join("");
    document.getElementById("home-topics").innerHTML = topicsHTML;
  }

  function statCard(num, label) {
    return '<div class="stat-card"><div class="num">' + num + '</div><div class="label">' + label + "</div></div>";
  }

  function animatedStatCard(id, label, suffix, iconSvg) {
    var labelHTML = iconSvg ? '<span class="label-with-icon">' + iconSvg + "<span>" + label + "</span></span>" : label;
    return '<div class="stat-card"><div class="num" id="' + id + '">0</div><div class="label">' + labelHTML + "</div></div>";
  }

  // ---------- Flashcards ----------
  var cardsSession = null; // { queue: [...], index, showingBack }
  var cardsFilter = "due";
  var cardsListView = false;

  function renderCards() {
    var tpl = document.getElementById("tpl-cards");
    app.innerHTML = "";
    app.appendChild(tpl.content.cloneNode(true));

    var select = document.getElementById("cards-topic-select");
    select.innerHTML = topicOptionsHTML(true);
    var saved = sessionStorage.getItem("cardsTopic") || "all";
    select.value = saved;

    var pendingFilter = sessionStorage.getItem("cardsFilter");
    sessionStorage.removeItem("cardsFilter");
    cardsFilter = pendingFilter || "due";
    cardsListView = false;

    var listToggle = document.getElementById("cards-list-toggle");
    if (listToggle) {
      listToggle.innerHTML = ICONS.list;
      listToggle.classList.toggle("active", cardsListView);
      listToggle.addEventListener("click", function () {
        cardsListView = !cardsListView;
        listToggle.classList.toggle("active", cardsListView);
        renderCardStage();
      });
    }

    var filterSelect = document.getElementById("cards-filter-select");
    filterSelect.value = cardsFilter;
    filterSelect.addEventListener("change", function () {
      cardsFilter = filterSelect.value;
      startCardsSession(select.value);
    });

    select.addEventListener("change", function () {
      sessionStorage.setItem("cardsTopic", select.value);
      startCardsSession(select.value);
    });

    startCardsSession(select.value);
  }

  var RATING_FILTERS = { again: 0, hard: 1, good: 2, easy: 3 };

  function startCardsSession(topicId) {
    var queue, dueCount = 0;

    if (RATING_FILTERS.hasOwnProperty(cardsFilter)) {
      queue = ratedCards(topicId, RATING_FILTERS[cardsFilter]);
    } else if (cardsFilter === "fav") {
      queue = favoriteCards(topicId);
    } else if (cardsFilter === "all") {
      queue = shuffle(cardsForTopic(topicId));
    } else {
      var due = dueCards(topicId);
      var newOnes = cardsForTopic(topicId).filter(function (c) {
        var s = state.cards[c.id];
        return !s || s.reps === 0;
      }).filter(function (c) { return due.indexOf(c) === -1; });
      queue = due.concat(newOnes);
      dueCount = due.length;
    }

    cardsSession = { queue: queue, index: 0, showingBack: false, dueCount: dueCount };

    var jumpId = sessionStorage.getItem("cardsJumpId");
    if (jumpId) {
      sessionStorage.removeItem("cardsJumpId");
      var jumpIndex = -1;
      for (var i = 0; i < queue.length; i++) {
        if (queue[i].id === jumpId) { jumpIndex = i; break; }
      }
      if (jumpIndex !== -1) cardsSession.index = jumpIndex;
    }

    renderCardStage();
  }

  var RATING_LABELS = { again: '„Nochmal“', hard: '„Schwer“', good: '„Gut“', easy: '„Einfach“' };

  function updateCardsHint() {
    var hint = document.getElementById("cards-hint");
    if (!hint || !cardsSession) return;
    var remaining = cardsSession.queue.length - cardsSession.index;

    if (RATING_FILTERS.hasOwnProperty(cardsFilter)) {
      var label = RATING_LABELS[cardsFilter];
      hint.textContent = remaining ? remaining + " mit " + label + " bewertete Karte(n)" : "Aktuell keine Karten mit " + label + ".";
    } else if (cardsFilter === "fav") {
      hint.textContent = remaining ? remaining + " Favorit(en)" : "Noch keine Favoriten markiert.";
    } else if (cardsFilter === "all") {
      hint.textContent = remaining ? remaining + " von " + cardsSession.queue.length + " übrig" : "Alle Karten durchgesehen!";
    } else {
      var remainingDue = Math.max(0, cardsSession.dueCount - cardsSession.index);
      var remainingNew = remaining - remainingDue;
      hint.textContent = remaining ? remainingDue + " fällig, " + remainingNew + " neu" : "Für dieses Thema ist gerade nichts fällig.";
    }
  }

  function renderCardList(stage) {
    if (!cardsSession.queue.length) {
      stage.innerHTML = '<div class="empty-state">Keine Karten in dieser Auswahl.</div>';
      return;
    }
    stage.innerHTML = '<div class="card-list">' + cardsSession.queue.map(function (c, i) {
      return (
        '<button class="card-list-item' + (i === cardsSession.index ? " current" : "") + '" data-i="' + i + '">' +
        '<span class="card-list-num">' + (i + 1) + "</span>" +
        '<span class="card-list-text">' + truncateText(c.front, 90) + "</span>" +
        "</button>"
      );
    }).join("") + "</div>";

    stage.querySelectorAll(".card-list-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        cardsSession.index = parseInt(btn.dataset.i, 10);
        cardsListView = false;
        var listToggle = document.getElementById("cards-list-toggle");
        if (listToggle) listToggle.classList.remove("active");
        renderCardStage();
      });
    });
  }

  function renderCardStage() {
    var stage = document.getElementById("cards-stage");
    updateCardsHint();

    if (cardsListView) {
      renderCardList(stage);
      return;
    }

    if (!cardsSession || cardsSession.index >= cardsSession.queue.length) {
      stage.innerHTML = '<div class="empty-state"><span class="wiggle-icon">' + ICONS.check + '</span><br>Alles erledigt für jetzt!<br>Schau später wieder vorbei oder wähle ein anderes Thema.</div>';
      return;
    }
    var card = cardsSession.queue[cardsSession.index];
    cardsSession.showingBack = false;

    var hasNext1 = cardsSession.index + 1 < cardsSession.queue.length;
    var hasNext2 = cardsSession.index + 2 < cardsSession.queue.length;
    var stackHTML = (hasNext2 ? '<div class="stack-card stack-2"></div>' : "") + (hasNext1 ? '<div class="stack-card stack-1"></div>' : "");

    stage.innerHTML =
      '<div class="flashcard-wrap">' +
      stackHTML +
      '<div class="flashcard" id="flashcard">' +
      '<div class="flashcard-inner">' +
      '<div class="flashcard-face flashcard-front">' + card.front + "</div>" +
      '<div class="flashcard-face flashcard-back">' + card.back + "</div>" +
      "</div></div>" +
      '<button class="fav-btn' + (isFavorite(card.id) ? " active" : "") + '" id="fav-btn" aria-label="Favorit">' + ICONS.star + "</button>" +
      (card.scriptExcerpt ? '<button class="script-btn" id="script-btn" aria-label="Im Skript nachlesen" title="Im Skript nachlesen">' + ICONS.book + "</button>" : "") +
      "</div>" +
      '<div class="flip-hint" id="flip-hint">Tippen zum Umdrehen · ' + card.topicTitle + "</div>" +
      '<div class="rate-row" id="rate-row">' +
      '<button class="rate-again" data-r="0">Nochmal</button>' +
      '<button class="rate-hard" data-r="1">Schwer</button>' +
      '<button class="rate-good" data-r="2">Gut</button>' +
      '<button class="rate-easy" data-r="3">Einfach</button>' +
      "</div>";

    var el = document.getElementById("flashcard");
    var hint = document.getElementById("flip-hint");
    var rateRow = document.getElementById("rate-row");
    var favBtn = document.getElementById("fav-btn");

    favBtn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      toggleFavorite(card.id);
      favBtn.classList.toggle("active", isFavorite(card.id));
    });

    var scriptBtn = document.getElementById("script-btn");
    if (scriptBtn) {
      scriptBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        openScriptModal(card);
      });
    }

    function setFlipped(flipped) {
      cardsSession.showingBack = flipped;
      el.classList.toggle("flipped", flipped);
      hint.textContent = flipped ? "Wie gut wusstest du die Antwort? (oder wischen)" : "Tippen zum Umdrehen · " + card.topicTitle;
      rateRow.classList.toggle("visible", flipped);
    }

    function advance(rating) {
      vibrate(12);
      rateCard(card.id, rating);
      cardsSession.index++;
      renderCardStage();
    }

    var isAdvancing = false;

    function flyIntoButton(btn, rating) {
      var cardRect = el.getBoundingClientRect();
      var btnRect = btn.getBoundingClientRect();
      var dx = (btnRect.left + btnRect.width / 2) - (cardRect.left + cardRect.width / 2);
      var dy = (btnRect.top + btnRect.height / 2) - (cardRect.top + cardRect.height / 2);
      el.classList.add("sucked");
      el.style.transform = "translate(" + dx + "px, " + dy + "px) scale(0.1) rotate(" + (dx / 20) + "deg)";
      el.style.opacity = "0";
      setTimeout(function () { advance(rating); }, 300);
    }

    rateRow.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (!cardsSession.showingBack || isAdvancing) return;
        isAdvancing = true;
        flyIntoButton(btn, parseInt(btn.dataset.r, 10));
      });
    });

    // Pointer-based tap (flip) + swipe (rate) handling
    var startX = 0, startY = 0, currentX = 0, dragging = false;

    el.addEventListener("pointerdown", function (e) {
      startX = e.clientX;
      startY = e.clientY;
      currentX = 0;
      dragging = true;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      if (cardsSession.showingBack) el.classList.add("dragging");
    });

    el.addEventListener("pointermove", function (e) {
      if (!dragging || !cardsSession.showingBack) return;
      currentX = e.clientX - startX;
      el.style.transform = "translateX(" + currentX + "px) rotate(" + (currentX / 18) + "deg)";
      el.classList.toggle("swipe-good", currentX > 40);
      el.classList.toggle("swipe-again", currentX < -40);
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      el.classList.remove("dragging", "swipe-good", "swipe-again");
      var threshold = 90;

      if (!cardsSession.showingBack) {
        if (Math.abs(e.clientX - startX) < 8 && Math.abs(e.clientY - startY) < 8) setFlipped(true);
        return;
      }

      if (currentX > threshold) {
        el.style.transform = "translateX(500px) rotate(24deg)";
        el.style.opacity = "0";
        setTimeout(function () { advance(2); }, 260);
      } else if (currentX < -threshold) {
        el.style.transform = "translateX(-500px) rotate(-24deg)";
        el.style.opacity = "0";
        setTimeout(function () { advance(0); }, 260);
      } else {
        el.style.transform = "";
        if (Math.abs(currentX) < 8) setFlipped(false);
      }
      currentX = 0;
    }

    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
  }

  // ---------- Skript-Nachschlagen ----------
  var scriptModal = document.getElementById("script-modal");
  var scriptModalTitle = document.getElementById("script-modal-title");
  var scriptModalBody = document.getElementById("script-modal-body");
  var scriptModalClose = document.getElementById("script-modal-close");

  function openScriptModal(card) {
    if (!scriptModal || !card.scriptExcerpt) return;
    scriptModalTitle.textContent = "Skript · Seite " + card.scriptPage;
    scriptModalBody.innerHTML =
      '<div class="script-source">' + escapeHtml(card.topicTitle || "") + "</div>" +
      '<div class="script-excerpt">' + escapeHtml(card.scriptExcerpt).replace(/\n/g, "<br>") + "</div>";
    scriptModal.hidden = false;
  }

  if (scriptModalClose) {
    scriptModalClose.addEventListener("click", function () { scriptModal.hidden = true; });
    scriptModal.addEventListener("click", function (e) {
      if (e.target === scriptModal) scriptModal.hidden = true;
    });
  }

  // ---------- Piles (cards grouped by last rating) ----------
  var PILE_DEFS = [
    { key: "again", rating: 0, label: "Nochmal", cls: "pile-again" },
    { key: "hard", rating: 1, label: "Schwer", cls: "pile-hard" },
    { key: "good", rating: 2, label: "Gut", cls: "pile-good" },
    { key: "easy", rating: 3, label: "Einfach", cls: "pile-easy" }
  ];

  function renderPiles() {
    var tpl = document.getElementById("tpl-piles");
    app.innerHTML = "";
    app.appendChild(tpl.content.cloneNode(true));

    var select = document.getElementById("piles-topic-select");
    select.innerHTML = topicOptionsHTML(true);
    var saved = sessionStorage.getItem("cardsTopic") || "all";
    select.value = saved;

    select.addEventListener("change", function () {
      sessionStorage.setItem("cardsTopic", select.value);
      renderPilesStage(select.value);
    });

    renderPilesStage(select.value);
  }

  function renderPilesStage(topicId) {
    var stage = document.getElementById("piles-stage");
    stage.innerHTML = '<div class="pile-list">' + PILE_DEFS.map(function (p) {
      var count = ratedCards(topicId, p.rating).length;
      var countLabel = count === 1 ? "Karte" : "Karten";
      return (
        '<button class="pile-card ' + p.cls + '" data-filter="' + p.key + '" type="button">' +
        '<span class="pile-tab">' + p.label + "</span>" +
        '<div class="pile-body">' +
        '<span class="pile-count">' + count + "</span>" +
        '<span class="pile-count-label">' + countLabel + "</span>" +
        "</div>" +
        '<div class="pile-stack" aria-hidden="true"><span class="pile-stack-card"></span><span class="pile-stack-card"></span></div>' +
        "</button>"
      );
    }).join("") + "</div>";

    stage.querySelectorAll(".pile-card").forEach(function (btn) {
      var def = PILE_DEFS.filter(function (p) { return p.key === btn.dataset.filter; })[0];
      var pressTimer = null;
      var longPressed = false;
      var startX = 0, startY = 0;

      function clearPress() {
        clearTimeout(pressTimer);
        pressTimer = null;
      }

      btn.addEventListener("pointerdown", function (e) {
        longPressed = false;
        startX = e.clientX;
        startY = e.clientY;
        clearPress();
        pressTimer = setTimeout(function () {
          longPressed = true;
          vibrate(15);
          openPileModal(def, topicId);
        }, 480);
      });

      btn.addEventListener("pointermove", function (e) {
        if (!pressTimer) return;
        if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) clearPress();
      });

      btn.addEventListener("pointerup", clearPress);
      btn.addEventListener("pointerleave", clearPress);
      btn.addEventListener("pointercancel", clearPress);

      btn.addEventListener("click", function () {
        if (longPressed) { longPressed = false; return; }
        sessionStorage.setItem("cardsFilter", btn.dataset.filter);
        sessionStorage.setItem("cardsTopic", topicId);
        goToView("cards");
      });
    });
  }

  var pileModal = document.getElementById("pile-modal");
  var pileModalTitle = document.getElementById("pile-modal-title");
  var pileModalList = document.getElementById("pile-modal-list");
  var pileModalClose = document.getElementById("pile-modal-close");

  function openPileModal(def, topicId) {
    var cards = ratedCards(topicId, def.rating);
    pileModalTitle.textContent = def.label + " · " + cards.length + (cards.length === 1 ? " Karte" : " Karten");

    if (!cards.length) {
      pileModalList.innerHTML = '<div class="search-hint">Keine Karten in diesem Stapel.</div>';
    } else {
      pileModalList.innerHTML = '<div class="card-list">' + cards.map(function (c, i) {
        return (
          '<button class="card-list-item" data-id="' + c.id + '">' +
          '<span class="card-list-num">' + (i + 1) + "</span>" +
          '<span class="card-list-text">' + truncateText(c.front, 90) + "</span>" +
          "</button>"
        );
      }).join("") + "</div>";

      pileModalList.querySelectorAll(".card-list-item").forEach(function (btn) {
        btn.addEventListener("click", function () {
          pileModal.hidden = true;
          sessionStorage.setItem("cardsFilter", def.key);
          sessionStorage.setItem("cardsTopic", topicId);
          sessionStorage.setItem("cardsJumpId", btn.dataset.id);
          goToView("cards");
        });
      });
    }

    pileModal.hidden = false;
  }

  if (pileModalClose) {
    pileModalClose.addEventListener("click", function () { pileModal.hidden = true; });
    pileModal.addEventListener("click", function (e) {
      if (e.target === pileModal) pileModal.hidden = true;
    });
  }

  // ---------- Quiz ----------
  var quizSession = null; // { questions, index, score, mode, answers, answered, selectedIndex, deadline }
  var quizMode = "practice";
  var quizListView = false;
  var examTimerInterval = null;

  function clearExamTimer() {
    if (examTimerInterval) { clearInterval(examTimerInterval); examTimerInterval = null; }
  }

  function renderQuiz() {
    var tpl = document.getElementById("tpl-quiz");
    app.innerHTML = "";
    app.appendChild(tpl.content.cloneNode(true));

    var select = document.getElementById("quiz-topic-select");
    select.innerHTML = topicOptionsHTML(true);
    var saved = sessionStorage.getItem("quizTopic") || "all";
    select.value = saved;

    quizMode = "practice";
    quizListView = false;
    var modeSelect = document.getElementById("quiz-mode-select");
    modeSelect.value = quizMode;
    modeSelect.addEventListener("change", function () {
      quizMode = modeSelect.value;
      startQuizSession(select.value, quizMode);
    });

    var listToggle = document.getElementById("quiz-list-toggle");
    if (listToggle) {
      listToggle.innerHTML = ICONS.list;
      listToggle.classList.toggle("active", quizListView);
      listToggle.addEventListener("click", function () {
        quizListView = !quizListView;
        listToggle.classList.toggle("active", quizListView);
        renderQuizStage();
      });
    }

    updateModeCounts();

    select.addEventListener("change", function () {
      sessionStorage.setItem("quizTopic", select.value);
      updateModeCounts();
      startQuizSession(select.value, quizMode);
    });

    startQuizSession(select.value, quizMode);
  }

  function updateModeCounts() {
    var select = document.getElementById("quiz-topic-select");
    if (!select) return;
    var wrongOption = document.getElementById("quiz-mode-wrong-option");
    var rightOption = document.getElementById("quiz-mode-right-option");
    if (wrongOption) {
      var wrongCount = wrongQuizQuestions(select.value).length;
      wrongOption.textContent = "Falsch beantwortet" + (wrongCount ? " (" + wrongCount + ")" : "");
    }
    if (rightOption) {
      var rightCount = rightQuizQuestions(select.value).length;
      rightOption.textContent = "Richtig beantwortet" + (rightCount ? " (" + rightCount + ")" : "");
    }
  }

  function startQuizSession(topicId, mode) {
    clearExamTimer();
    var questions;
    if (mode === "wrong") {
      questions = shuffle(wrongQuizQuestions(topicId));
    } else if (mode === "right") {
      questions = shuffle(rightQuizQuestions(topicId));
    } else {
      var pool = shuffle(quizForTopic(topicId));
      questions = mode === "exam" ? pool : pool.slice(0, 15);
    }
    quizSession = {
      questions: questions,
      index: 0,
      score: 0,
      mode: mode || "practice",
      answers: new Array(questions.length).fill(null),
      answered: false,
      selectedIndex: null,
      deadline: mode === "exam" ? Date.now() + questions.length * 40 * 1000 : null
    };

    if (mode === "exam" && questions.length) {
      examTimerInterval = setInterval(function () {
        if (!quizSession || quizSession.mode !== "exam") { clearExamTimer(); return; }
        var remaining = quizSession.deadline - Date.now();
        var timerEl = document.getElementById("quiz-timer");
        if (timerEl) timerEl.innerHTML = ICONS.clock + "<span>" + formatTime(remaining) + "</span>";
        if (remaining <= 0) {
          clearExamTimer();
          quizSession.index = quizSession.questions.length;
          renderQuizStage();
        }
      }, 1000);
    }

    renderQuizStage();
  }

  function quizEmptyMessage() {
    if (quizSession && quizSession.mode === "wrong") return "Aktuell nichts zu wiederholen – du hast gerade keine offenen falsch beantworteten Fragen in diesem Thema.";
    if (quizSession && quizSession.mode === "right") return "Noch keine richtig beantworteten Fragen in diesem Thema.";
    return "Für dieses Thema gibt es noch keine Quizfragen.";
  }

  function renderQuizList(stage) {
    if (!quizSession.questions.length) {
      stage.innerHTML = '<div class="empty-state">' + quizEmptyMessage() + "</div>";
      return;
    }

    stage.innerHTML = '<div class="card-list">' + quizSession.questions.map(function (q, i) {
      var answered = quizSession.answers[i];
      var statusClass = "";
      var numContent = String(i + 1);
      if (answered !== null) {
        if (answered === q.correct) { statusClass = " correct"; numContent = ICONS.check; }
        else { statusClass = " wrong"; numContent = ICONS.cross; }
      }
      return (
        '<button class="card-list-item' + (i === quizSession.index ? " current" : "") + '" data-i="' + i + '">' +
        '<span class="card-list-num' + statusClass + '">' + numContent + "</span>" +
        '<span class="card-list-text">' + truncateText(q.question, 90) + "</span>" +
        "</button>"
      );
    }).join("") + "</div>";

    stage.querySelectorAll(".card-list-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = parseInt(btn.dataset.i, 10);
        quizSession.index = i;
        var answered = quizSession.answers[i];
        quizSession.answered = answered !== null;
        quizSession.selectedIndex = answered;
        quizListView = false;
        var listToggle = document.getElementById("quiz-list-toggle");
        if (listToggle) listToggle.classList.remove("active");
        renderQuizStage();
      });
    });
  }

  function renderQuizStage() {
    var stage = document.getElementById("quiz-stage");
    if (!quizSession) return;

    if (quizListView) {
      renderQuizList(stage);
      return;
    }

    if (quizSession.questions.length === 0) {
      stage.innerHTML = '<div class="empty-state">' + quizEmptyMessage() + "</div>";
      return;
    }

    if (quizSession.index >= quizSession.questions.length) {
      clearExamTimer();
      var pct = Math.round((quizSession.score / quizSession.questions.length) * 100);
      var resultMsg = pct >= 80 ? "Stark gemacht!" : pct >= 50 ? "Guter Versuch!" : "Dranbleiben, du schaffst das!";
      var reviewHTML = "";
      if (quizSession.mode === "exam") {
        reviewHTML = '<div class="quiz-review"><h4>Auswertung</h4>' +
          quizSession.questions.map(function (q, i) {
            var answered = quizSession.answers[i];
            var correct = answered === q.correct;
            var yourAnswer = answered === null ? "– keine Antwort –" : q.options[answered];
            return (
              '<div class="review-item ' + (correct ? "review-correct" : "review-wrong") + '">' +
              '<div class="review-q">' + q.question + "</div>" +
              '<div class="review-a">Deine Antwort: ' + yourAnswer + "</div>" +
              (correct ? "" : '<div class="review-a right-answer">Richtig: ' + q.options[q.correct] + "</div>") +
              "</div>"
            );
          }).join("") +
          "</div>";
      }
      stage.innerHTML =
        '<div class="quiz-result">' +
        '<div class="result-msg">' + resultMsg + "</div>" +
        '<div class="score">' + quizSession.score + " / " + quizSession.questions.length + "</div>" +
        "<div>" + pct + "% richtig</div>" +
        '<button class="btn" id="quiz-restart">Neue Runde</button>' +
        "</div>" + reviewHTML;
      document.getElementById("quiz-restart").addEventListener("click", function () {
        var select = document.getElementById("quiz-topic-select");
        startQuizSession(select.value, quizMode);
      });
      if (pct >= 80) spawnConfetti(stage.querySelector(".quiz-result"));
      return;
    }

    var q = quizSession.questions[quizSession.index];
    var isExam = quizSession.mode === "exam";
    var optionsHTML = q.options.map(function (opt, i) {
      var cls = "quiz-option";
      if (quizSession.answered) {
        if (isExam) {
          if (i === quizSession.selectedIndex) cls += " selected-neutral";
        } else {
          if (i === q.correct) cls += " correct";
          else if (i === quizSession.selectedIndex) cls += " wrong";
        }
      }
      return '<button class="' + cls + '" data-i="' + i + '" ' + (quizSession.answered ? "disabled" : "") + ">" + opt + "</button>";
    }).join("");

    var timerHTML = isExam ? '<span class="quiz-timer" id="quiz-timer">' + ICONS.clock + "<span>" + formatTime(quizSession.deadline - Date.now()) + "</span></span>" : "";

    stage.innerHTML =
      '<div class="quiz-progress">Frage ' + (quizSession.index + 1) + " von " + quizSession.questions.length + " · " + q.topicTitle + timerHTML + "</div>" +
      '<div class="quiz-question">' +
      '<div class="qtext">' + q.question + "</div>" +
      optionsHTML +
      (!isExam && quizSession.answered && q.explanation ? '<div class="quiz-explain">' + q.explanation + "</div>" : "") +
      "</div>" +
      '<div class="quiz-footer">' +
      (quizSession.answered ? '<button class="btn" id="quiz-next">Weiter</button>' : "") +
      "</div>";

    if (!quizSession.answered) {
      stage.querySelectorAll(".quiz-option").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var i = parseInt(btn.dataset.i, 10);
          answerQuiz(q, i);
        });
      });
    } else {
      document.getElementById("quiz-next").addEventListener("click", function () {
        quizSession.index++;
        quizSession.answered = false;
        quizSession.selectedIndex = null;
        renderQuizStage();
      });
    }
  }

  function answerQuiz(q, selectedIndex) {
    quizSession.answered = true;
    quizSession.selectedIndex = selectedIndex;
    quizSession.answers[quizSession.index] = selectedIndex;
    var stat = quizStat(q.id);
    stat.attempts++;
    stat.lastCorrect = selectedIndex === q.correct;
    if (stat.lastCorrect) {
      quizSession.score++;
      stat.correct++;
    }
    logActivity();
    updateModeCounts();
    renderQuizStage();
  }

  // ---------- Progress ----------
  function renderHistoryChart() {
    var days = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    var dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    var counts = days.map(function (d) {
      var key = d.toISOString().slice(0, 10);
      return (state.history && state.history[key]) || 0;
    });
    var max = Math.max(1, Math.max.apply(null, counts));
    var bars = counts.map(function (c, i) {
      var h = Math.round((c / max) * 100);
      return '<div class="hist-bar-wrap"><div class="hist-bar" style="height:' + Math.max(h, 4) + '%"></div><div class="hist-label">' + dayNames[days[i].getDay()] + "</div></div>";
    }).join("");
    return '<div class="progress-topic"><h4>Letzte 7 Tage</h4><div class="history-chart">' + bars + "</div></div>";
  }

  function renderProgress() {
    var tpl = document.getElementById("tpl-progress");
    app.innerHTML = "";
    app.appendChild(tpl.content.cloneNode(true));

    var html = renderHistoryChart() + TOPICS.map(function (t) {
      var cardIds = t.cards.map(function (c) { return c.id; });
      var learned = cardIds.filter(function (id) { return state.cards[id] && state.cards[id].reps > 0; }).length;
      var lapses = cardIds.reduce(function (s, id) { return s + (state.cards[id] ? state.cards[id].lapses : 0); }, 0);

      var quizIds = t.quiz.map(function (q) { return q.id; });
      var attempts = quizIds.reduce(function (s, id) { return s + (state.quiz[id] ? state.quiz[id].attempts : 0); }, 0);
      var correct = quizIds.reduce(function (s, id) { return s + (state.quiz[id] ? state.quiz[id].correct : 0); }, 0);
      var acc = attempts > 0 ? Math.round((correct / attempts) * 100) : null;

      return (
        '<div class="progress-topic">' +
        "<h4>" + t.title + "</h4>" +
        '<div class="progress-bar-track"><div class="progress-bar-fill" style="width:' + Math.round((learned / cardIds.length) * 100) + '%"></div></div>' +
        '<div class="progress-metric"><span>Karteikarten gelernt</span><span>' + learned + " / " + cardIds.length + "</span></div>" +
        '<div class="progress-metric"><span>Fehlversuche (Nochmal)</span><span>' + lapses + "</span></div>" +
        '<div class="progress-metric"><span>Quiz-Trefferquote</span><span>' + (acc === null ? "–" : acc + "%") + "</span></div>" +
        "</div>"
      );
    }).join("");

    document.getElementById("progress-stage").innerHTML = html;

    document.getElementById("reset-progress").addEventListener("click", function () {
      if (confirm("Wirklich den gesamten Lernfortschritt zurücksetzen?")) {
        state = { cards: {}, quiz: {}, history: {}, favorites: {} };
        saveState();
        renderProgress();
      }
    });

  }

  // ---------- Init ----------
  render();
})();
