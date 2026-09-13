# Prüfungstrainer

Eine kleine, statische Web-App zum Lernen für die Abschlussprüfung – Karteikarten mit Spaced Repetition, ein Multiple-Choice-Quiz und Fortschritts-Tracking. Läuft komplett im Browser, keine Installation nötig.

## Nutzung

Einfach `index.html` öffnen (lokal per Doppelklick oder über GitHub Pages hosten). Der Lernfortschritt wird lokal im Browser gespeichert (`localStorage`).

- **Karteikarten**: Karte antippen zum Umdrehen, danach bewerten (Nochmal / Schwer / Gut / Einfach). Karten werden nach einem vereinfachten SM-2-Algorithmus (wie bei Anki) in Intervallen wiederholt.
- **Quiz**: Multiple-Choice-Fragen je Thema oder gemischt, mit direkter Auswertung.
- **Fortschritt**: Übersicht über gelernte Karten, Fehlversuche und Quiz-Trefferquote pro Thema.

## Aktueller Lernstoff

- **Grundstücksrecht** (Skript Dr. Roth/Abitz, Lehrwoche Elfershausen 2026): Eigentum am Grundstück, Formen des Eigentums, Erwerb (Kaufvertrag/Auflassung), Grundbuch, Dienstbarkeiten, Nießbrauch, Reallast, Grundpfandrechte.

Weitere Themen/Skripte folgen und werden nachträglich ergänzt.

## Neue Themen ergänzen

Alle Lerninhalte liegen in [`data.js`](./data.js). Für ein neues Thema einfach ein weiteres Objekt in `window.STUDY_DATA.topics` hinzufügen:

```js
{
  id: "eindeutige-id",
  title: "Anzeigename des Themas",
  source: "Woher der Stoff stammt (optional)",
  cards: [
    { id: "xy-01", front: "Frage/Begriff", back: "Antwort/Erklärung" }
  ],
  quiz: [
    { id: "xyq-01", question: "Frage", options: ["A", "B", "C", "D"], correct: 1, explanation: "optional" }
  ]
}
```

Die App (`app.js`) liest neue Themen automatisch ein – kein weiterer Code nötig.
