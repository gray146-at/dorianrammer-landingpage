/* E-Mail-Adresse gegen Adress-Sammler: Im HTML steht sie nur als „office (at) dorianrammer.at“.
   Erst im Browser wird daraus ein anklickbarer Link (Verfahren „JS-Zusammensetzen“,
   in Honeypot-Tests von Adress-Sammlern nicht erkannt). Ohne JavaScript bleibt der lesbare Text. */
(function(){
  'use strict';
  var stellen = document.querySelectorAll('[data-post-name][data-post-domain]');
  Array.prototype.forEach.call(stellen, function(el){
    var adresse = el.getAttribute('data-post-name') + String.fromCharCode(64) + el.getAttribute('data-post-domain');
    var a = document.createElement('a');
    a.href = 'mailto:' + adresse;
    a.textContent = adresse;
    el.replaceWith(a);
  });
})();
