(function () {
  "use strict";

  var TOPICS = window.STUDY_DATA.topics;
  var STORAGE_KEY = "examTrainer:v1";
  var DAY_MS = 24 * 60 * 60 * 1000;

  // ---------- State ----------
  function loadState() {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    if (!raw) return { cards: {}, quiz: {} };
    try {
      var parsed = JSON.parse(raw);
      return { cards: parsed.cards || {}, quiz: parsed.quiz || {} };
    } catch (e) {
      return { cards: {}, quiz: {} };
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
    saveState();
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
    var colors = ["#8b5cf6", "#ec4899", "#34d399", "#fbbf24", "#38bdf8"];
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

  function render() {
    if (currentView === "home") renderHome();
    else if (currentView === "cards") renderCards();
    else if (currentView === "quiz") renderQuiz();
    else if (currentView === "progress") renderProgress();
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

  function renderCards() {
    var tpl = document.getElementById("tpl-cards");
    app.innerHTML = "";
    app.appendChild(tpl.content.cloneNode(true));

    var select = document.getElementById("cards-topic-select");
    select.innerHTML = topicOptionsHTML(true);
    var saved = sessionStorage.getItem("cardsTopic") || "all";
    select.value = saved;

    select.addEventListener("change", function () {
      sessionStorage.setItem("cardsTopic", select.value);
      startCardsSession(select.value);
    });

    startCardsSession(select.value);
  }

  function startCardsSession(topicId) {
    var due = dueCards(topicId);
    var newOnes = cardsForTopic(topicId).filter(function (c) {
      var s = state.cards[c.id];
      return !s || s.reps === 0;
    }).filter(function (c) { return due.indexOf(c) === -1; });

    var queue = due.concat(newOnes);
    cardsSession = { queue: queue, index: 0, showingBack: false };

    var hint = document.getElementById("cards-hint");
    hint.textContent = queue.length
      ? due.length + " fällig, " + newOnes.length + " neu"
      : "Für dieses Thema ist gerade nichts fällig.";

    renderCardStage();
  }

  function renderCardStage() {
    var stage = document.getElementById("cards-stage");
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

    el.addEventListener("click", function () {
      cardsSession.showingBack = !cardsSession.showingBack;
      el.classList.toggle("flipped", cardsSession.showingBack);
      hint.textContent = cardsSession.showingBack ? "Wie gut wusstest du die Antwort?" : "Tippen zum Umdrehen · " + card.topicTitle;
      rateRow.classList.toggle("visible", cardsSession.showingBack);
    });

    rateRow.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (!cardsSession.showingBack) return;
        rateCard(card.id, parseInt(btn.dataset.r, 10));
        cardsSession.index++;
        renderCardStage();
      });
    });
  }

  // ---------- Quiz ----------
  var quizSession = null; // { questions, index, score, answered, selectedIndex }

  function renderQuiz() {
    var tpl = document.getElementById("tpl-quiz");
    app.innerHTML = "";
    app.appendChild(tpl.content.cloneNode(true));

    var select = document.getElementById("quiz-topic-select");
    select.innerHTML = topicOptionsHTML(true);
    var saved = sessionStorage.getItem("quizTopic") || "all";
    select.value = saved;

    select.addEventListener("change", function () {
      sessionStorage.setItem("quizTopic", select.value);
      startQuizSession(select.value);
    });

    startQuizSession(select.value);
  }

  function startQuizSession(topicId) {
    var questions = shuffle(quizForTopic(topicId)).slice(0, 15);
    quizSession = { questions: questions, index: 0, score: 0, answered: false, selectedIndex: null };
    renderQuizStage();
  }

  function renderQuizStage() {
    var stage = document.getElementById("quiz-stage");
    if (!quizSession || quizSession.questions.length === 0) {
      stage.innerHTML = '<div class="empty-state">Für dieses Thema gibt es noch keine Quizfragen.</div>';
      return;
    }
    if (quizSession.index >= quizSession.questions.length) {
      var pct = Math.round((quizSession.score / quizSession.questions.length) * 100);
      var resultMsg = pct >= 80 ? "🎉 Stark gemacht!" : pct >= 50 ? "💪 Guter Versuch!" : "📚 Dranbleiben, du schaffst das!";
      stage.innerHTML =
        '<div class="quiz-result">' +
        '<div class="result-msg">' + resultMsg + "</div>" +
        '<div class="score">' + quizSession.score + " / " + quizSession.questions.length + "</div>" +
        "<div>" + pct + "% richtig</div>" +
        '<button class="btn" id="quiz-restart">Neue Runde</button>' +
        "</div>";
      document.getElementById("quiz-restart").addEventListener("click", function () {
        var select = document.getElementById("quiz-topic-select");
        startQuizSession(select.value);
      });
      if (pct >= 80) spawnConfetti(stage.querySelector(".quiz-result"));
      return;
    }

    var q = quizSession.questions[quizSession.index];
    var optionsHTML = q.options.map(function (opt, i) {
      var cls = "quiz-option";
      if (quizSession.answered) {
        if (i === q.correct) cls += " correct";
        else if (i === quizSession.selectedIndex) cls += " wrong";
      }
      return '<button class="' + cls + '" data-i="' + i + '" ' + (quizSession.answered ? "disabled" : "") + ">" + opt + "</button>";
    }).join("");

    stage.innerHTML =
      '<div class="quiz-progress">Frage ' + (quizSession.index + 1) + " von " + quizSession.questions.length + " · " + q.topicTitle + "</div>" +
      '<div class="quiz-question">' +
      '<div class="qtext">' + q.question + "</div>" +
      optionsHTML +
      (quizSession.answered && q.explanation ? '<div class="quiz-explain">' + q.explanation + "</div>" : "") +
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
    var stat = quizStat(q.id);
    stat.attempts++;
    if (selectedIndex === q.correct) {
      quizSession.score++;
      stat.correct++;
    }
    saveState();
    renderQuizStage();
  }

  // ---------- Progress ----------
  function renderProgress() {
    var tpl = document.getElementById("tpl-progress");
    app.innerHTML = "";
    app.appendChild(tpl.content.cloneNode(true));

    var html = TOPICS.map(function (t) {
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
        state = { cards: {}, quiz: {} };
        saveState();
        renderProgress();
      }
    });
  }

  // ---------- Init ----------
  render();
})();
