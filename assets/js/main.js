/* UltraLeve Metalúrgica
   Sem dependência externa. Um IntersectionObserver, um listener de scroll passivo. */
(function () {
  'use strict';

  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ano do rodapé ---------- */
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- header ao rolar ---------- */
  /* Um marcador a 40px do topo, vigiado por IntersectionObserver. Ler window.scrollY
     logo na carga forçava um layout síncrono da página inteira (110 ms no Lighthouse). */
  var hdr = document.getElementById('hdr');
  if ('IntersectionObserver' in window) {
    var marco = document.createElement('div');
    marco.setAttribute('aria-hidden', 'true');
    marco.style.cssText = 'position:absolute;top:40px;left:0;width:1px;height:1px;pointer-events:none';
    document.body.insertBefore(marco, document.body.firstChild);
    new IntersectionObserver(function (e) {
      hdr.classList.toggle('stuck', !e[0].isIntersecting);
    }).observe(marco);
  } else {
    window.addEventListener('scroll', function () {
      hdr.classList.toggle('stuck', window.scrollY > 40);
    }, { passive: true });
  }

  /* ---------- fundo da fábrica sob demanda ---------- */
  /* Fundo de CSS baixa na carga mesmo fora da tela, disputando banda com o hero.
     Aqui ele só entra quando a seção chega a 800px da janela. */
  var fabBg = document.querySelector('.fab__bg');
  if (fabBg) {
    if ('IntersectionObserver' in window) {
      var obsBg = new IntersectionObserver(function (e) {
        if (!e[0].isIntersecting) return;
        fabBg.classList.add('on');
        obsBg.disconnect();
      }, { rootMargin: '800px 0px' });
      obsBg.observe(fabBg);
    } else {
      fabBg.classList.add('on');
    }
  }

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

  /* O escalonamento nasce na hora de revelar, só entre os cards que entram juntos
     (a fileira que acabou de aparecer). Antes era o índice dentro do grupo inteiro:
     o 25º card do catálogo esperava mais de 1,5 s e a tela ficava vazia. O limite de
     5 passos de 40 ms deixa o efeito em cascata sem atrasar ninguém. A leitura começa
     15% antes da borda de baixo, pra o card já estar no lugar quando o olho chegar. */
  var obs = new IntersectionObserver(function (entradas) {
    var k = 0;
    entradas.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      if (el.classList.contains('reveal')) {
        el.style.setProperty('--rd', (Math.min(k, 5) * 40) + 'ms');
        k++;
      }
      el.classList.add('in');
      el.querySelectorAll('.num').forEach(function (n) { contar(n); });
      if (el.classList.contains('num')) contar(el);
      obs.unobserve(el);
    });
  }, { rootMargin: '0px 0px 15% 0px', threshold: 0 });

  alvos.forEach(function (el) { obs.observe(el); });
})();
