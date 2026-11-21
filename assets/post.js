/* E-Mail-Adresse gegen Adress-Sammler: Im HTML steht sie nur als „office (at) dorianrammer.at“.
   Erst im Browser wird daraus ein anklickbarer Link (Verfahren „JS-Zusammensetzen“,
   in Honeypot-Tests von Adress-Sammlern nicht erkannt). Ohne JavaScript bleibt der lesbare Text. */
(function(){
  'use strict';
  // Nur diese Adresse wird zusammengesetzt; der Seitentext dient bloß als Schlüssel.
  var POSTFAECHER = { office: ['office', 'dorianrammer.at'] };
  var stellen = document.querySelectorAll('[data-post-name][data-post-domain]');
  Array.prototype.forEach.call(stellen, function(el){
    var schluessel = el.getAttribute('data-post-name');
    var eintrag = Object.prototype.hasOwnProperty.call(POSTFAECHER, schluessel) ? POSTFAECHER[schluessel] : null;
    if(!eintrag){ return; }
    var adresse = eintrag[0] + String.fromCharCode(64) + eintrag[1];
    var a = document.createElement('a');
    a.href = 'mailto:' + adresse;
    a.textContent = adresse;
    el.replaceWith(a);
  });
})();
