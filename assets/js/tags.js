/* UltraLeve Metalúrgica — Google Ads e GA4
 * ============================================================
 * Mede o que importa aqui: clique no WhatsApp e clique no telefone.
 * Não existe formulário no site, então essa é a única conversão que há.
 *
 * Cada evento leva TRÊS informações:
 *   peca    qual peça a pessoa pediu (sai da mensagem do WhatsApp)
 *   pagina  de qual página veio (home, barra-de-ancoragem, faquetas, pinos-e-cunhas)
 *   origem  de qual parte da página saiu o clique (hero, catalogo, equipe, barra-fixa...)
 *
 * PREENCHER ANTES DE SUBIR. Sem os IDs o arquivo não faz nada e avisa no console.
 * ============================================================ */

var UL_TAGS = {
  /* Google Ads > Admin > Configurações da conta. Formato: 'AW-123456789' */
  ads: 'AW-18467754341',

  /* O rótulo da ação de conversão. Google Ads > Objetivos > Conversões >
     criar ação "Clique no WhatsApp" do tipo Site, método manual com código.
     Ele mostra send_to: 'AW-123456789/AbC-D_efGh12345'. Cole aqui SÓ a parte
     depois da barra. */
  rotuloWhatsapp: 'i8pjCMnnjIQdEOWijuZE',

  /* Opcional, mesma coisa para uma ação "Clique no telefone" */
  rotuloTelefone: '',

  /* GA4 > Admin > Fluxos de dados. Formato: 'G-XXXXXXXXXX' */
  ga4: '',
};

(function () {
  'use strict';

  var temAds = /^AW-\d+$/.test(UL_TAGS.ads);
  var temGa4 = /^G-[A-Z0-9]+$/.test(UL_TAGS.ga4);

  if (!temAds && !temGa4) {
    console.warn('[UltraLeve] Nenhuma tag configurada. Preencha UL_TAGS em assets/js/tags.js');
    return;
  }

  /* O dataLayer guarda o que for disparado antes do gtag.js chegar, então dá pra
     medir clique de quem é rápido no gatilho sem segurar a página no carregamento. */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('js', new Date());
  if (temAds) gtag('config', UL_TAGS.ads);
  if (temGa4) gtag('config', UL_TAGS.ga4);

  /* ---------- o gtag.js entra depois, sem atrapalhar a primeira pintura ---------- */
  /* O site foi de 78 pra 97 no Lighthouse por causa de peso no carregamento.
     Aqui o script só baixa quando o navegador está ocioso, ou na hora em que a
     pessoa clica, o que vier primeiro. Nada se perde: o dataLayer já guardou. */
  var carregando = false;
  function carregarGtag() {
    if (carregando) return;
    carregando = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + (temAds ? UL_TAGS.ads : UL_TAGS.ga4);
    document.head.appendChild(s);
  }

  if ('requestIdleCallback' in window) {
    window.addEventListener('load', function () { requestIdleCallback(carregarGtag, { timeout: 4000 }); });
  } else {
    window.addEventListener('load', function () { setTimeout(carregarGtag, 2500); });
  }

  /* ---------- de onde veio o clique ---------- */

  function qualPagina() {
    var p = location.pathname.replace(/^\/+|\/+$/g, '');
    if (!p || p === 'index.html') return 'home';
    return p.replace(/\/index\.html$/, '');
  }

  /* A mensagem já diz a peça: "...orçamento para *Pino 4.0*." O que está entre
     asteriscos é o nome exato do item do catálogo. */
  function qualPeca(href) {
    try {
      var texto = decodeURIComponent((href.split('text=')[1] || '').replace(/\+/g, ' '));
      var m = texto.match(/\*([^*]+)\*/);
      if (m) return m[1];
    } catch (e) { /* href estranho não pode derrubar o clique */ }

    var pag = qualPagina();
    if (pag === 'barra-de-ancoragem') return 'Barra de ancoragem';
    if (pag === 'faquetas') return 'Faquetas';
    if (pag === 'pinos-e-cunhas') return 'Pinos e cunhas';
    return 'Geral';
  }

  var PORCLASSE = [
    ['wsp', 'barra-fixa'],
    ['hdr__cta', 'cabecalho'],
    ['fam__go', 'catalogo'],
    ['pc__go', 'mais-vendidos'],
    ['fam__c--ajuda', 'nao-sei-a-peca'],
    ['rep__c', 'equipe'],
    ['junto__l', 'vai-junto'],
    ['ft__cta', 'rodape'],
    ['ft__soc', 'rodape'],
  ];

  function qualOrigem(el) {
    for (var no = el; no && no !== document.body; no = no.parentElement) {
      for (var i = 0; i < PORCLASSE.length; i++) {
        if (no.classList && no.classList.contains(PORCLASSE[i][0])) return PORCLASSE[i][1];
      }
      if (no.id) return no.id;
      if (no.classList && no.classList.contains('hero')) return 'hero';
    }
    return 'pagina';
  }

  /* ---------- o clique ---------- */

  /* Um ouvinte só, delegado no documento: pega todos os links de WhatsApp da página
     sem precisar marcar nenhum deles no HTML, e continua valendo se o gerador
     das LPs criar link novo. Os CTAs de seção caem no id da seção como origem
     (fabrica, clientes, como, tecnologia, depoimentos, duvidas). */
  document.addEventListener(
    'click',
    function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;

      var href = a.getAttribute('href') || '';
      var whats = href.indexOf('wa.me/') !== -1 || href.indexOf('api.whatsapp.com') !== -1;
      var fone = href.indexOf('tel:') === 0;
      if (!whats && !fone) return;

      carregarGtag();

      var dados = {
        peca: qualPeca(href),
        pagina: qualPagina(),
        origem: qualOrigem(a),
      };

      /* GA4: é esse evento que aparece em Relatórios e que dá pra importar
         como conversão no Google Ads, se o Felipe preferir esse caminho. */
      if (temGa4) gtag('event', whats ? 'clique_whatsapp' : 'clique_telefone', dados);

      /* Google Ads direto: chega mais rápido que a importação do GA4 e é o que
         o lance usa pra aprender. Só dispara se o rótulo estiver preenchido. */
      if (temAds) {
        var rotulo = whats ? UL_TAGS.rotuloWhatsapp : UL_TAGS.rotuloTelefone;
        if (rotulo) {
          gtag('event', 'conversion', {
            send_to: UL_TAGS.ads + '/' + rotulo,
            /* o link abre em aba nova, a página não descarrega, então não
               precisa de event_callback nem de segurar a navegação */
          });
        }
      }
    },
    /* captura: roda antes de qualquer outro clique da página e não é cancelável
       por nada que o main.js faça */
    true
  );
})();
