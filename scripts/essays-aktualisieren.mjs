#!/usr/bin/env node
/*
  Trägt die neuesten Essays von widerstandskraft.link in die Startseiten ein.

  Deutsch:  index.html     aus https://www.widerstandskraft.link/rss/
  Englisch: en/index.html  aus https://www.widerstandskraft.link/en/rss/

  Ersetzt wird nur der Bereich zwischen den Markierungen
    <!-- essays:start ... -->  und  <!-- essays:ende -->

  Aufruf (Node 18 oder neuer, keine Abhängigkeiten):
    node scripts/essays-aktualisieren.mjs            Vorschau, ändert nichts
    node scripts/essays-aktualisieren.mjs --schreiben
    node scripts/essays-aktualisieren.mjs --anzahl 3 (Standard: 3)

  Danach committen und pushen; live geht es mit dem nächsten Merge auf main.
*/
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const schreiben = args.includes('--schreiben');
const anzahlIndex = args.indexOf('--anzahl');
const anzahl = anzahlIndex >= 0 ? Number(args[anzahlIndex + 1]) : 3;

const seiten = [
  { datei: 'index.html', feed: 'https://www.widerstandskraft.link/rss/', sprache: 'de' },
  { datei: 'en/index.html', feed: 'https://www.widerstandskraft.link/en/rss/', sprache: 'en' },
];

const MONATE = {
  de: ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

function datumText(d, sprache) {
  const tag = d.getDate();
  const monat = MONATE[sprache][d.getMonth()];
  return sprache === 'de' ? `${tag}. ${monat} ${d.getFullYear()}` : `${tag} ${monat} ${d.getFullYear()}`;
}

function datumIso(d) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

function entschaerfen(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function xmlText(t) {
  return t
    .replace(/^<!\[CDATA\[|\]\]>$/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .trim();
}

function feld(item, name) {
  const m = item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? xmlText(m[1]) : '';
}

// Datum in Wiener Zeit, damit ein Beitrag von 23:30 nicht auf den Folgetag rutscht
function wienerDatum(pubDate) {
  const teile = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(pubDate));
  const w = Object.fromEntries(teile.map((t) => [t.type, t.value]));
  return new Date(Number(w.year), Number(w.month) - 1, Number(w.day));
}

async function essaysLaden(feed) {
  const antwort = await fetch(feed, { headers: { 'User-Agent': 'dorianrammer.at essay-liste' } });
  if (!antwort.ok) throw new Error(`${feed}: HTTP ${antwort.status}`);
  const xml = await antwort.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  return items.slice(0, anzahl).map((item) => ({
    titel: feld(item, 'title'),
    link: feld(item, 'link'),
    datum: wienerDatum(feld(item, 'pubDate')),
  }));
}

function listeBauen(essays, sprache) {
  const zeilen = essays.map((e) =>
    `          <li><time datetime="${datumIso(e.datum)}">${datumText(e.datum, sprache)}</time>` +
    `<a href="${entschaerfen(e.link)}">${entschaerfen(e.titel)}</a></li>`
  );
  return ['        <ul class="texte">', ...zeilen, '        </ul>'].join('\n');
}

let geaendert = 0;
for (const seite of seiten) {
  const datei = path.join(wurzel, seite.datei);
  const html = await readFile(datei, 'utf8');
  const muster = /(<!-- essays:start[^>]*-->\n)([\s\S]*?)(\n\s*<!-- essays:ende -->)/;
  if (!muster.test(html)) throw new Error(`${seite.datei}: Markierungen essays:start / essays:ende fehlen`);

  const essays = await essaysLaden(seite.feed);
  if (essays.length === 0) throw new Error(`${seite.feed}: keine Beiträge gefunden`);
  const neu = html.replace(muster, (_, a, _alt, b) => a + listeBauen(essays, seite.sprache) + b);

  console.log(`\n${seite.datei}`);
  essays.forEach((e) => console.log(`  ${datumText(e.datum, seite.sprache)}  ${e.titel}`));

  if (neu === html) {
    console.log('  unverändert');
    continue;
  }
  geaendert++;
  if (schreiben) {
    await writeFile(datei, neu, 'utf8');
    console.log('  geschrieben');
  } else {
    console.log('  würde geändert (Vorschau; mit --schreiben übernehmen)');
  }
}
console.log(`\n${geaendert} Datei(en) ${schreiben ? 'geändert' : 'betroffen'}.`);
