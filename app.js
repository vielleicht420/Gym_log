(function () {
  "use strict";

  var TOPICS = window.STUDY_DATA.topics;
  var STORAGE_KEY = "examTrainer:v1";
  var THEME_KEY = "examTrainer:theme";
  var DAY_MS = 24 * 60 * 60 * 1000;

  // ---------- State ----------
  function loadState() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    if (!raw) return { cards: {}, quiz: {}, history: {} };
    try {
      var parsed = JSON.parse(raw);
      return { cards: parsed.cards || {}, quiz: parsed.quiz || {}, history: parsed.history || {} };
    } catch (e) {
      return { cards: {}, quiz: {}, history: {} };
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
    btn.textContent = pref === "light" ? "☀️" : pref === "dark" ? "🌙" : "🌓";
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

  function hardCards(topicId) {
    return cardsForTopic(topicId).filter(function (c) {
      var s = state.cards[c.id];
      return s && s.lapses > 0;
    }).sort(function (a, b) { return cardState(b.id).lapses - cardState(a.id).lapses; });
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

  function spawnConfetti(container) {
    if (!container) return;
    var colors = ["#5b7f99", "#5b9985", "#6fb98f", "#d9a552", "#7ea3bd"];
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

  function formatTime(ms) {
    var totalSec = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(totalSec / 60);
    var s = totalSec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  // ---------- View router ----------
  var app = document.getElementById("app");
  var tabs = document.querySelectorAll(".tab-btn");
  var currentView = "home";

  tabs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabs.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      currentView = btn.dataset.view;
      render();
    });
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
    else if (currentView === "quiz") renderQuiz();
    else if (currentView === "progress") renderProgress();
  }

  function goToView(view) {
    tabs.forEach(function (b) { b.classList.remove("active"); });
    var btn = document.querySelector('.tab-btn[data-view="' + view + '"]');
    if (btn) btn.classList.add("active");
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
      statCard(due, "Fällig heute"),
      statCard(learned + " / " + totalCards, "Karten gelernt"),
      statCard(accuracy + "%", "Quiz-Trefferquote")
    ].join("");

    var continueBtn = document.getElementById("home-continue");
    continueBtn.textContent = due > 0 ? "▶️ Weiter lernen (" + due + " fällig)" : "▶️ Weiter lernen";
    continueBtn.addEventListener("click", function () {
      sessionStorage.setItem("cardsTopic", "all");
      goToView("cards");
    });

    var topicsHTML = TOPICS.map(function (t) {
      var cardIds = t.cards.map(function (c) { return c.id; });
      var learnedInTopic = cardIds.filter(function (id) { return state.cards[id] && state.cards[id].reps > 0; }).length;
      var pct = cardIds.length ? Math.round((learnedInTopic / cardIds.length) * 100) : 0;
      return (
        '<div class="topic-card">' +
        "<h4>" + t.title + "</h4>" +
        '<div class="meta">' + t.cards.length + " Karteikarten · " + t.quiz.length + " Quizfragen</div>" +
        '<div class="progress-bar-track"><div class="progress-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="meta" style="margin-top:6px;">' + pct + "% gelernt</div>" +
        "</div>"
      );
    }).join("");
    document.getElementById("home-topics").innerHTML = topicsHTML;
  }

  function statCard(num, label) {
    return '<div class="stat-card"><div class="num">' + num + '</div><div class="label">' + label + "</div></div>";
  }

  // ---------- Flashcards ----------
  var cardsSession = null; // { queue: [...], index, showingBack }
  var cardsFilter = "due";

  function renderCards() {
    var tpl = document.getElementById("tpl-cards");
    app.innerHTML = "";
    app.appendChild(tpl.content.cloneNode(true));

    var select = document.getElementById("cards-topic-select");
    select.innerHTML = topicOptionsHTML(true);
    var saved = sessionStorage.getItem("cardsTopic") || "all";
    select.value = saved;

    cardsFilter = "due";
    var filterBtns = document.querySelectorAll("#cards-filter-row .filter-btn");
    filterBtns.forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.filter === cardsFilter);
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        cardsFilter = btn.dataset.filter;
        startCardsSession(select.value);
      });
    });

    select.addEventListener("change", function () {
      sessionStorage.setItem("cardsTopic", select.value);
      startCardsSession(select.value);
    });

    startCardsSession(select.value);
  }

  function startCardsSession(topicId) {
    var queue, dueCount = 0;

    if (cardsFilter === "hard") {
      queue = hardCards(topicId);
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
    renderCardStage();
  }

  function updateCardsHint() {
    var hint = document.getElementById("cards-hint");
    if (!hint || !cardsSession) return;
    var remaining = cardsSession.queue.length - cardsSession.index;

    if (cardsFilter === "hard") {
      hint.textContent = remaining ? remaining + " schwierige Karte(n) übrig" : "Aktuell keine schwierigen Karten mehr – stark!";
    } else if (cardsFilter === "all") {
      hint.textContent = remaining ? remaining + " von " + cardsSession.queue.length + " übrig" : "Alle Karten durchgesehen!";
    } else {
      var remainingDue = Math.max(0, cardsSession.dueCount - cardsSession.index);
      var remainingNew = remaining - remainingDue;
      hint.textContent = remaining ? remainingDue + " fällig, " + remainingNew + " neu" : "Für dieses Thema ist gerade nichts fällig.";
    }
  }

  function renderCardStage() {
    var stage = document.getElementById("cards-stage");
    updateCardsHint();
    if (!cardsSession || cardsSession.index >= cardsSession.queue.length) {
      stage.innerHTML = '<div class="empty-state"><span class="wiggle-emoji">🎉</span><br>Alles erledigt für jetzt!<br>Schau später wieder vorbei oder wähle ein anderes Thema.</div>';
      return;
    }
    var card = cardsSession.queue[cardsSession.index];
    cardsSession.showingBack = false;

    stage.innerHTML =
      '<div class="flashcard-wrap">' +
      '<div class="flashcard" id="flashcard">' +
      '<div class="flashcard-inner">' +
      '<div class="flashcard-face flashcard-front">' + card.front + "</div>" +
      '<div class="flashcard-face flashcard-back">' + card.back + "</div>" +
      "</div></div></div>" +
      '<div class="flip-hint" id="flip-hint">Tippen zum Umdrehen · ' + card.topicTitle + "</div>" +
      '<div class="rate-row" id="rate-row">' +
      '<button class="rate-again" data-r="0"><span>😖</span>Nochmal</button>' +
      '<button class="rate-hard" data-r="1"><span>🙁</span>Schwer</button>' +
      '<button class="rate-good" data-r="2"><span>🙂</span>Gut</button>' +
      '<button class="rate-easy" data-r="3"><span>🤩</span>Einfach</button>' +
      "</div>";

    var el = document.getElementById("flashcard");
    var hint = document.getElementById("flip-hint");
    var rateRow = document.getElementById("rate-row");

    function setFlipped(flipped) {
      cardsSession.showingBack = flipped;
      el.classList.toggle("flipped", flipped);
      hint.textContent = flipped ? "Wie gut wusstest du die Antwort? (oder wischen)" : "Tippen zum Umdrehen · " + card.topicTitle;
      rateRow.classList.toggle("visible", flipped);
    }

    function advance(rating) {
      rateCard(card.id, rating);
      cardsSession.index++;
      renderCardStage();
    }

    rateRow.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (!cardsSession.showingBack) return;
        advance(parseInt(btn.dataset.r, 10));
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

  // ---------- Quiz ----------
  var quizSession = null; // { questions, index, score, mode, answers, answered, selectedIndex, deadline }
  var quizMode = "practice";
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
    var modeBtns = document.querySelectorAll("#quiz-mode-row .filter-btn");
    modeBtns.forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.mode === quizMode);
      btn.addEventListener("click", function () {
        modeBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        quizMode = btn.dataset.mode;
        startQuizSession(select.value, quizMode);
      });
    });

    select.addEventListener("change", function () {
      sessionStorage.setItem("quizTopic", select.value);
      startQuizSession(select.value, quizMode);
    });

    startQuizSession(select.value, quizMode);
  }

  function startQuizSession(topicId, mode) {
    clearExamTimer();
    var pool = shuffle(quizForTopic(topicId));
    var questions = mode === "exam" ? pool : pool.slice(0, 15);
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
        if (timerEl) timerEl.textContent = "⏱ " + formatTime(remaining);
        if (remaining <= 0) {
          clearExamTimer();
          quizSession.index = quizSession.questions.length;
          renderQuizStage();
        }
      }, 1000);
    }

    renderQuizStage();
  }

  function renderQuizStage() {
    var stage = document.getElementById("quiz-stage");
    if (!quizSession || quizSession.questions.length === 0) {
      stage.innerHTML = '<div class="empty-state">Für dieses Thema gibt es noch keine Quizfragen.</div>';
      return;
    }

    if (quizSession.index >= quizSession.questions.length) {
      clearExamTimer();
      var pct = Math.round((quizSession.score / quizSession.questions.length) * 100);
      var resultMsg = pct >= 80 ? "🎉 Stark gemacht!" : pct >= 50 ? "💪 Guter Versuch!" : "📚 Dranbleiben, du schaffst das!";
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

    var timerHTML = isExam ? '<span class="quiz-timer" id="quiz-timer">⏱ ' + formatTime(quizSession.deadline - Date.now()) + "</span>" : "";

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
    if (selectedIndex === q.correct) {
      quizSession.score++;
      stat.correct++;
    }
    logActivity();
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
        state = { cards: {}, quiz: {}, history: {} };
        saveState();
        renderProgress();
      }
    });

    document.getElementById("export-progress").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "pruefungstrainer-fortschritt.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    var importInput = document.getElementById("import-file");
    document.getElementById("import-progress").addEventListener("click", function () {
      importInput.click();
    });
    importInput.addEventListener("change", function () {
      var file = importInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(reader.result);
          if (!parsed || typeof parsed !== "object") throw new Error("invalid");
          state = { cards: parsed.cards || {}, quiz: parsed.quiz || {}, history: parsed.history || {} };
          saveState();
          renderProgress();
        } catch (e) {
          alert("Die Datei konnte nicht gelesen werden. Bitte eine gültige Fortschritts-Datei wählen.");
        }
        importInput.value = "";
      };
      reader.readAsText(file);
    });
  }

  // ---------- Init ----------
  render();
})();
