(function () {
  "use strict";

  var LINK_CHECKOUT_BASE = "https://loja-alara.nuvemshop.com.br/checkout/serum-vitamina-c";

  // ---------------------------------------------------------------
  // 1) UTM: de qual anúncio essa pessoa veio?
  //
  // Quando um anúncio no Instagram/Facebook (ou Google Ads) aponta pra
  // esta página, o link do anúncio normalmente termina em algo como:
  //   ?utm_source=instagram&utm_medium=cpc&utm_campaign=lancamento-serum
  // Isso não é mágica do Instagram — é o ANUNCIANTE que monta esse link
  // assim, de propósito, na hora de criar o anúncio. Cada plataforma
  // (Nuvemshop, Google Analytics, etc.) sabe ler esses parâmetros e
  // agrupar "quantas vendas vieram da campanha X" sozinha.
  //
  // Sem isso, você sabe que vendeu, mas não sabe QUAL anúncio vendeu —
  // e sem saber qual anúncio funcionou, não dá pra decidir onde
  // continuar investindo o dinheiro do tráfego pago.
  // ---------------------------------------------------------------
  function capturarUtm() {
    var params = new URLSearchParams(window.location.search);
    var campos = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
    var utm = {};
    var temAlgum = false;
    campos.forEach(function (campo) {
      var valor = params.get(campo);
      if (valor) {
        utm[campo] = valor;
        temAlgum = true;
      }
    });

    if (temAlgum) {
      // sessionStorage (não localStorage): guarda só durante esta visita.
      // Se guardássemos pra sempre, um clique antigo "roubaria" o crédito
      // de uma compra que na verdade veio de outro anúncio dias depois.
      sessionStorage.setItem("alara_utm", JSON.stringify(utm));
    }

    return temAlgum ? utm : lerUtmSalva();
  }

  function lerUtmSalva() {
    try {
      var salvo = sessionStorage.getItem("alara_utm");
      return salvo ? JSON.parse(salvo) : null;
    } catch (e) {
      return null;
    }
  }

  function mostrarBadgeOrigem(utm) {
    if (!utm || !utm.utm_source) return;
    var badge = document.getElementById("origem-badge");
    badge.textContent = "Você veio de: " + utm.utm_source;
    badge.hidden = false;
  }

  // Acrescenta os parâmetros UTM no link de checkout, pra Nuvemshop (ou
  // qualquer ferramenta de análise ligada a ela) saber de onde veio
  // essa venda específica — é o mesmo princípio do "não perder o fio"
  // que os anúncios pedem: o rastro começa no clique do anúncio e
  // precisa sobreviver até a compra ser concluída.
  function montarLinkComUtm(base, utm) {
    if (!utm) return base;
    var params = new URLSearchParams();
    Object.keys(utm).forEach(function (k) { params.set(k, utm[k]); });
    var separador = base.indexOf("?") > -1 ? "&" : "?";
    return base + separador + params.toString();
  }

  // ---------------------------------------------------------------
  // 2) Onde o Pixel do Meta seria chamado
  //
  // Se o snippet oficial do Pixel estivesse carregado (ver comentário
  // no <head> do index.html), o clique no botão "Comprar agora" é
  // exatamente o momento de avisar o Meta que essa pessoa demonstrou
  // intenção de compra — isso é o evento "InitiateCheckout". É esse
  // sinal que o algoritmo do Instagram usa pra achar mais gente
  // parecida com quem realmente compra (não só quem clica).
  // ---------------------------------------------------------------
  function rastrearCliqueComprar() {
    if (typeof window.fbq === "function") {
      window.fbq("track", "InitiateCheckout");
    }
    // Sem o Pixel real conectado, isso não faz nada — é só o lugar
    // certo, no fluxo certo, pronto pra quando a conta de anúncio existir.
  }

  function configurarLinksDeCompra(utm) {
    var link = montarLinkComUtm(LINK_CHECKOUT_BASE, utm);
    document.querySelectorAll("#cta-header, #cta-hero, #cta-final, .cta-float, .oferta .btn").forEach(function (el) {
      el.href = link;
      el.addEventListener("click", rastrearCliqueComprar);
    });
  }

  // ---------------------------------------------------------------
  // 3) Contagem regressiva — mesma data pra todo mundo
  //
  // Um erro comum (e antiético) em página de tráfego pago é fazer o
  // contador reiniciar a cada visita, criando uma urgência falsa que
  // nunca acaba de verdade. Aqui o prazo é fixo: sempre o próximo
  // domingo às 23:59 — todo mundo que visita durante a mesma semana vê
  // a mesma contagem, e ela realmente chega a zero.
  // ---------------------------------------------------------------
  function proximoFimDeSemana() {
    var agora = new Date();
    var diasAteDomingo = (7 - agora.getDay()) % 7;
    var alvo = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + diasAteDomingo, 23, 59, 59);
    if (alvo <= agora) alvo.setDate(alvo.getDate() + 7);
    return alvo;
  }

  function iniciarCountdown() {
    var alvo = proximoFimDeSemana();
    var elDias = document.getElementById("cd-dias");
    var elHoras = document.getElementById("cd-horas");
    var elMin = document.getElementById("cd-min");
    var elSeg = document.getElementById("cd-seg");

    function atualizar() {
      var diff = Math.max(0, alvo - new Date());
      var dias = Math.floor(diff / 86400000);
      var horas = Math.floor((diff % 86400000) / 3600000);
      var min = Math.floor((diff % 3600000) / 60000);
      var seg = Math.floor((diff % 60000) / 1000);
      elDias.textContent = String(dias).padStart(2, "0");
      elHoras.textContent = String(horas).padStart(2, "0");
      elMin.textContent = String(min).padStart(2, "0");
      elSeg.textContent = String(seg).padStart(2, "0");
    }

    atualizar();
    setInterval(atualizar, 1000);
  }

  // ---------------------------------------------------------------
  // 4) FAQ (quebra de objeção) — accordion simples
  // ---------------------------------------------------------------
  function configurarFaq() {
    document.querySelectorAll(".faq-item").forEach(function (item) {
      var botao = item.querySelector(".faq-pergunta");
      var resposta = item.querySelector(".faq-resposta");
      botao.addEventListener("click", function () {
        var aberto = botao.getAttribute("aria-expanded") === "true";
        botao.setAttribute("aria-expanded", aberto ? "false" : "true");
        resposta.style.maxHeight = aberto ? "0" : resposta.scrollHeight + "px";
      });
    });
  }

  // ---------------------------------------------------------------
  function main() {
    var utm = capturarUtm();
    mostrarBadgeOrigem(utm);
    configurarLinksDeCompra(utm);
    iniciarCountdown();
    configurarFaq();

    var precoFloat = document.getElementById("cta-float-preco");
    if (precoFloat) precoFloat.textContent = "R$ 129,90";
  }

  document.addEventListener("DOMContentLoaded", main);
})();
