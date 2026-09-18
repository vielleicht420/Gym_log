# Winkfried Immobilien

Eine moderne, hochwertige Website für ein fiktives Immobilienmakler-Unternehmen.
Statische Website ohne Build-Schritt – läuft komplett im Browser.

## Nutzung

Einfach `index.html` öffnen (lokal per Doppelklick oder über GitHub Pages hosten).
Es gibt keinen Build-Prozess und keine Abhängigkeiten.

## Struktur

- `index.html` – Seitenstruktur (Hero, Leistungen, Immobilien, Über uns, Ablauf,
  Team, Kundenstimmen, FAQ, Kontakt, Footer)
- `style.css` – Design (Farben, Typografie, Layout, Responsive Breakpoints)
- `app.js` – Interaktivität: Sticky-Header, mobiles Menü, Scroll-Reveal-Animationen,
  animierte Statistik-Zähler, Immobilien-Filter (Kaufen/Mieten), Kundenstimmen-Slider,
  FAQ-Akkordeon, Kontaktformular-Validierung, Impressum/Datenschutz-Modal

## Inhalte anpassen

- **Immobilienangebote**: Array `PROPERTIES` in `app.js` bearbeiten (Titel, Ort,
  Preis, Typ `kaufen`/`mieten`, Zimmer, Fläche).
- **Team & Kundenstimmen**: direkt in `index.html` in den jeweiligen Sektionen
  (`#team`, `.testimonials`) anpassen.
- **Kontaktdaten**: Sektion `#kontakt` in `index.html`.

Alle Inhalte (Firmenname, Team, Angebote, Kontaktdaten) sind Platzhalter für
Demo-Zwecke und sollten vor einem produktiven Einsatz durch echte Daten ersetzt werden.
