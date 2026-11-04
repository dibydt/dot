(function () {
  var btn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  var chips = document.querySelectorAll('.chip');
  var cards = document.querySelectorAll('.card[data-skills]');
  var open = document.querySelector('.card.open');
  var empty = document.getElementById('empty');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.dataset.filter, shown = 0;
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('on', on);
        c.setAttribute('aria-pressed', on);
      });
      cards.forEach(function (card) {
        var match = f === 'all' || card.dataset.skills.split(' ').indexOf(f) > -1;
        card.hidden = !match;
        if (match) shown++;
      });
      open.hidden = f !== 'all';
      empty.hidden = shown > 0;
    });
  });

  document.getElementById('yr').textContent = new Date().getFullYear();

  var WORKER_URL = 'https://dot-form.YOUR-SUBDOMAIN.workers.dev';
  var form = document.getElementById('reqForm');
  var rbtn = document.getElementById('reqBtn');
  var status = document.getElementById('reqStatus');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'status';
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    data.authorised = form.elements.authorised.checked;
    rbtn.disabled = true;
    status.textContent = 'Sending...';
    fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) throw new Error('bad');
      window.location.href = '/thanks.html';
    }).catch(function () {
      rbtn.disabled = false;
      status.className = 'status err';
      status.textContent = 'Could not send. Check the fields and try again.';
    });
  });
})();
