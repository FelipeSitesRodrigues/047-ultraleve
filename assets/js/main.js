/* UltraLeve Metalúrgica
   Sem dependência externa. Um IntersectionObserver, um listener de scroll passivo. */
(function () {
  'use strict';

  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ano do rodapé ---------- */
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- header ao rolar ---------- */
  var hdr = document.getElementById('hdr');
  var travado = false;
  function aoRolar() {
    if (travado) return;
    travado = true;
    requestAnimationFrame(function () {
      hdr.classList.toggle('stuck', window.scrollY > 40);
      travado = false;
    });
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  /* ---------- menu mobile ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  function fecharMenu() {
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menu');
  }
  burger.addEventListener('click', function () {
    var aberto = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(aberto));
    burger.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') fecharMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      fecharMenu();
      burger.focus();
    }
  });

  /* ---------- catálogo: sanfona fechada no celular ----------
     Vem aberto no HTML pra quem está no desktop ou sem JS ver tudo de uma vez. */
  var grupos = document.querySelectorAll('.cat .grp');
  var estreito = window.matchMedia('(max-width: 860px)');
  var jaMexeu = false;
  function ajustarGrupos(mq) {
    if (jaMexeu) return;
    for (var i = 0; i < grupos.length; i++) grupos[i].open = !mq.matches;
  }
  if (grupos.length) {
    ajustarGrupos(estreito);
    estreito.addEventListener('change', ajustarGrupos);
    /* depois que a pessoa abre ou fecha um grupo, o navegador manda */
    for (var j = 0; j < grupos.length; j++) {
      grupos[j].addEventListener('toggle', function () { jaMexeu = true; });
    }
  }

  /* ---------- contadores ---------- */
  function contar(el) {
    var alvo = parseInt(el.dataset.count, 10);
    if (!alvo || calmo) return;
    var pre = el.dataset.prefix || '';
    var suf = el.dataset.suffix || '';
    var dur = 1100;
    var t0 = null;

    function passo(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      var v = Math.round(alvo * eased);
      el.textContent = pre + v.toLocaleString('pt-BR') + suf;
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  /* ---------- reveal e corte a plasma ---------- */
  var alvos = document.querySelectorAll('.reveal, .cut');

  if (!('IntersectionObserver' in window) || calmo) {
    alvos.forEach(function (el) { el.classList.add('in'); });
    document.querySelectorAll('.num').forEach(function (el) {
      var alvo = parseInt(el.dataset.count, 10);
      if (alvo) {
        el.textContent = (el.dataset.prefix || '') + alvo.toLocaleString('pt-BR') + (el.dataset.suffix || '');
      }
    });
    return;
  }

  /* escalona irmãos dentro do mesmo grupo, sem precisar marcar no HTML */
  document.querySelectorAll('.fam, .steps, .dif__g, .dep__g, .trust__grid, .pc__grid, .faq__l, .cat')
    .forEach(function (grupo) {
      var i = 0;
      Array.prototype.forEach.call(grupo.children, function (filho) {
        if (filho.classList.contains('reveal')) {
          filho.style.setProperty('--rd', (i * 65) + 'ms');
          i++;
        }
      });
    });

  var obs = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('.num').forEach(function (n) { contar(n); });
      if (e.target.classList.contains('num')) contar(e.target);
      obs.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

  alvos.forEach(function (el) { obs.observe(el); });
})();
