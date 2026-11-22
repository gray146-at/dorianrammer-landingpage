/* Seite „Wofür ich stehe“: roter Faden und sanftes Einblenden.
   Der Faden wächst mit dem Lesen und bleibt dann stehen; Punkte füllen sich, wenn er ein Feld erreicht.
   Ohne JavaScript oder bei „Bewegung reduzieren“ bleibt alles sofort sichtbar und fertig. */
(function(){
  'use strict';
  var feld = document.querySelector('[data-haltung]');
  if(!feld){ return; }
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){ return; }

  var felder = Array.prototype.slice.call(feld.querySelectorAll('.haltung-feld'));
  var bloecke = feld.querySelectorAll('.satz-block');
  document.documentElement.classList.add('bewegt');
  feld.classList.add('laeuft');

  if('IntersectionObserver' in window){
    var beobachter = new IntersectionObserver(function(eintraege){
      eintraege.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('sichtbar'); beobachter.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    Array.prototype.forEach.call(bloecke, function(b){ beobachter.observe(b); });
  } else {
    Array.prototype.forEach.call(bloecke, function(b){ b.classList.add('sichtbar'); });
  }

  var hoechst = 0, wartet = false;
  function zeichnen(){
    wartet = false;
    var r = feld.getBoundingClientRect();
    var marke = window.innerHeight * 0.62;
    var p = Math.max(0, Math.min(1, (marke - r.top) / r.height));
    if(window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4){ p = 1; }
    if(p > hoechst){ hoechst = p; feld.style.setProperty('--fortschritt', hoechst.toFixed(4)); }
    var ende = r.top + r.height * hoechst;
    felder.forEach(function(f){
      if(f.getBoundingClientRect().top + 80 <= ende){ f.classList.add('erreicht'); }
    });
  }
  feld.style.setProperty('--fortschritt', '0');
  window.addEventListener('scroll', function(){ if(!wartet){ wartet = true; window.requestAnimationFrame(zeichnen); } }, { passive: true });
  window.addEventListener('resize', zeichnen);
  zeichnen();
})();
