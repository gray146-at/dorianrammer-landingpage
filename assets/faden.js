/* Roter Faden: verbindet die Einleitung mit den Projekten.
   Zeichnet sich einmal (Stamm beim Laden, Gabelung beim Scrollen) und bleibt dann stehen.
   Zeigt man auf ein Projekt, wird sein Ast kräftiger.
   Ohne JavaScript fehlt nur die Linie; bei „Bewegung reduzieren“ steht sie sofort fertig da. */
(function(){
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var SCHMAL = 860;
  var ruhig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var start = document.querySelector('[data-faden-start]');
  var wurzel = document.querySelector('[data-faden-wurzel]');
  var ziele = {};
  Array.prototype.forEach.call(document.querySelectorAll('[data-faden]'), function(el){
    ziele[el.getAttribute('data-faden')] = el;
  });
  if(!start || !wurzel || !ziele.wk || !ziele.af || !ziele.ql){ return; }

  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'faden');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML =
    '<defs><mask id="faden-maske" maskUnits="userSpaceOnUse"><path pathLength="1"/></mask></defs>' +
    '<path class="stamm" pathLength="1"/>' +
    '<path class="ast-wk" pathLength="1"/>' +
    '<path class="ast-af" pathLength="1"/>' +
    '<path class="ast-ql offen" mask="url(#faden-maske)"/>';
  document.body.appendChild(svg);

  var maske = svg.querySelector('#faden-maske');
  var p = {
    stamm: svg.querySelector('.stamm'),
    wk: svg.querySelector('.ast-wk'),
    af: svg.querySelector('.ast-af'),
    ql: svg.querySelector('.ast-ql'),
    qlMaske: maske.querySelector('path')
  };

  function rahmen(el){
    var r = el.getBoundingClientRect();
    return { l: r.left + window.scrollX, t: r.top + window.scrollY, b: r.bottom + window.scrollY };
  }

  // Mitte einer Textzeile (erste oder letzte), damit der Faden auf Höhe der Schrift ansetzt
  function zeile(el, letzte){
    var g = document.createRange();
    g.selectNodeContents(el);
    var z = g.getClientRects();
    if(!z.length){ var r = el.getBoundingClientRect(); return { r: r.right + window.scrollX, m: (r.top + r.bottom) / 2 + window.scrollY }; }
    var q = letzte ? z[z.length - 1] : z[0];
    return { r: q.right + window.scrollX, m: (q.top + q.bottom) / 2 + window.scrollY };
  }

  function linie(el, d){ el.setAttribute('d', d); }

  function zeichnen(){
    var doc = document.documentElement;
    var breite = doc.scrollWidth, hoehe = doc.scrollHeight;
    svg.setAttribute('width', breite);
    svg.setAttribute('height', hoehe);
    maske.setAttribute('x', 0); maske.setAttribute('y', 0);
    maske.setAttribute('width', breite); maske.setAttribute('height', hoehe);

    var wk = zeile(ziele.wk), af = zeile(ziele.af), ql = zeile(ziele.ql);
    var wkL = rahmen(ziele.wk).l, afL = rahmen(ziele.af).l, qlL = rahmen(ziele.ql).l;
    var w = rahmen(wurzel), wz = zeile(wurzel, true);
    var d;

    if(window.innerWidth > SCHMAL){
      // breit: Stamm von der Einleitung zur Überschrift, dann Gabelung im Spaltenzwischenraum
      var s = rahmen(start), gx = wkL - 34;
      p.stamm.style.display = '';
      linie(p.stamm, 'M' + (s.l + 0.75) + ' ' + (s.b + 24) + ' V' + (w.t - 18));
      linie(p.wk, 'M' + (wz.r + 16) + ' ' + wk.m + ' H' + (wkL - 12));
      linie(p.af, 'M' + gx + ' ' + wk.m + ' V' + af.m + ' H' + (afL - 12));
      d = 'M' + gx + ' ' + af.m + ' V' + ql.m + ' H' + (qlL - 12);
    } else {
      // schmal: Faden am linken Rand, beginnt bei „Woran ich arbeite“
      var gs = wkL - 26;
      p.stamm.style.display = 'none';
      linie(p.wk, 'M' + (w.l - 10) + ' ' + wz.m + ' H' + gs + ' V' + wk.m + ' H' + (wkL - 9));
      linie(p.af, 'M' + gs + ' ' + wk.m + ' V' + af.m + ' H' + (afL - 9));
      d = 'M' + gs + ' ' + af.m + ' V' + ql.m + ' H' + (qlL - 9);
    }
    linie(p.ql, d);
    linie(p.qlMaske, d);
  }

  var linien = [p.stamm, p.wk, p.af, p.qlMaske];
  var animiert = !ruhig && typeof Element.prototype.animate === 'function';
  if(animiert){
    linien.forEach(function(l){ l.style.strokeDasharray = '1'; l.style.strokeDashoffset = '1'; });
  }

  function ziehe(l, dauer){
    if(!animiert){ return Promise.resolve(); }
    var a = l.animate(
      [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
      { duration: dauer, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }
    );
    // Nach dem Zeichnen die Strichmuster entfernen, damit die Linie in jedem Browser durchgezogen bleibt
    function fertig(){ l.style.strokeDasharray = 'none'; l.style.strokeDashoffset = ''; a.cancel(); }
    return a.finished ? a.finished.then(fertig, function(){}) : Promise.resolve();
  }

  function warte(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

  zeichnen();
  window.addEventListener('resize', zeichnen);
  window.addEventListener('load', zeichnen);
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(zeichnen); }
  if('ResizeObserver' in window){ new ResizeObserver(zeichnen).observe(document.body); }

  var stammFertig = (animiert && window.innerWidth > SCHMAL)
    ? warte(350).then(function(){ return ziehe(p.stamm, 1100); })
    : Promise.resolve();

  var gestartet = false;
  function gabelung(){
    if(gestartet){ return; }
    gestartet = true;
    stammFertig.then(function(){
      ziehe(p.wk, 800);
      warte(450).then(function(){ ziehe(p.af, 800); });
      warte(950).then(function(){ ziehe(p.qlMaske, 1000); });
    });
  }

  if(animiert && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(eintraege){
      if(eintraege[0].isIntersecting){ gabelung(); io.disconnect(); }
    }, { rootMargin: '0px 0px -35% 0px' });
    io.observe(wurzel);
  } else {
    gabelung();
  }

  // Zeigen oder Fokus auf ein Projekt hebt seinen Ast hervor
  [['wk', p.wk], ['af', p.af], ['ql', p.ql]].forEach(function(paar){
    var ziel = ziele[paar[0]];
    var bereich = ziel.closest('[data-faden-bereich]') || ziel;
    function an(){ paar[1].classList.add('aktiv'); }
    function aus(){ paar[1].classList.remove('aktiv'); }
    bereich.addEventListener('mouseenter', an);
    bereich.addEventListener('mouseleave', aus);
    bereich.addEventListener('focusin', an);
    bereich.addEventListener('focusout', aus);
  });
})();
