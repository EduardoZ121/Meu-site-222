(function () {
  var CATEGORIES = {
    fashion: { icon: "👗", title: "Roupa & Moda", subtitle: "Fashion & Apparel", cost: 95 },
    drinks: { icon: "🥤", title: "Bebidas", subtitle: "Drinks & Beverages", cost: 95 },
    cars: { icon: "🚗", title: "Automóveis", subtitle: "Automotive", cost: 95 },
    cosmetics: { icon: "💄", title: "Cosméticos", subtitle: "Cosmetics & Beauty", cost: 95 },
    websites: { icon: "📱", title: "Sites & Apps", subtitle: "Websites & Apps", cost: 95 },
    food: { icon: "🍽️", title: "Alimentação", subtitle: "Food & Dining", cost: 95 },
    jewelry: { icon: "💎", title: "Joias", subtitle: "Jewelry", cost: 95 },
    realEstate: { icon: "🏠", title: "Imobiliário", subtitle: "Real Estate", cost: 95 },
    gaming: { icon: "🎮", title: "Gaming", subtitle: "Gaming Products", cost: 95 },
  };

  var ICONS = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M15 18l-6-6 6-6"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 6l6 6-6 6"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18"><path d="M4 7h6l2 2h8v10H4V7z"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M3 16l4-3 3 2 5-5 6 6"/></svg>',
  };

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function topNav() {
    return (
      '<header class="rp-topnav">' +
        '<div class="rp-topnav__left">' +
          '<button class="rp-icon-btn" type="button" aria-label="Menu">' + ICONS.menu + '</button>' +
          '<div class="rp-logo"><span class="rp-logo__mark">RP</span><span class="rp-logo__text">RemakePix</span></div>' +
        '</div>' +
        '<div class="rp-topnav__right">' +
          '<div class="rp-credits"><span class="rp-credits__gem">◆</span><span>40</span></div>' +
          '<button class="rp-btn-upgrade" type="button">Upgrade</button>' +
          '<div class="rp-avatar">A</div>' +
        '</div>' +
      '</header>'
    );
  }

  function subHeader(title, backHref) {
    return (
      '<div class="rp-subheader">' +
        '<a class="rp-icon-btn" href="' + backHref + '" aria-label="Voltar">' + ICONS.back + '</a>' +
        '<div class="rp-subheader__title">' + title + '<span class="rp-subheader__info">i</span></div>' +
        '<button class="rp-icon-btn rp-subheader__folder" type="button" aria-label="Pastas">' + ICONS.folder + '</button>' +
      '</div>'
    );
  }

  function bottomBar(cost) {
    return (
      '<footer class="rp-bottom-bar">' +
        '<div class="rp-stepper">' +
          '<button class="rp-stepper__btn" type="button" data-step="-1" aria-label="Menos">−</button>' +
          '<span class="rp-stepper__val"><span data-step-current>1</span>/4</span>' +
          '<button class="rp-stepper__btn" type="button" data-step="1" aria-label="Mais">+</button>' +
        '</div>' +
        '<button class="rp-generate-btn" type="button">✦ Generate · ' + cost + '</button>' +
      '</footer>'
    );
  }

  function previewSection(meta, ideasHtml) {
    var slots = "";
    for (var i = 0; i < 4; i++) {
      slots +=
        '<div class="rp-upload-slot' + (i === 0 ? " is-main" : i > 1 ? " is-dim" : "") + '">' +
          (i === 0 ? '<span class="rp-upload-slot__badge">Principal</span>' : "") +
          ICONS.image +
          '<span class="rp-upload-slot__label">' + (i === 0 ? "Add product image" : "Add reference") + '</span>' +
        '</div>';
    }

    return (
      '<div class="rp-content rp-preview">' +
        '<div class="rp-mode-tabs" role="tablist">' +
          '<button class="rp-mode-tab is-active" type="button" data-mode="upload">' +
            ICONS.image + ' Upload Images</button>' +
          '<button class="rp-mode-tab" type="button" data-mode="auto">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="22" height="22"><rect x="4" y="4" width="12" height="16" rx="2"/><path d="M8 9h6M8 12h4"/></svg>' +
            ' Auto Category</button>' +
        '</div>' +
        '<button class="rp-model-card" type="button">' +
          '<div class="rp-model-card__icon">S2</div>' +
          '<div><span class="rp-model-card__label">Model</span><span class="rp-model-card__value">Seedance 2.0 · ' + meta.title + '</span></div>' +
          ICONS.chevron +
        '</button>' +
        '<h2 class="rp-section-title">Upload product &amp; references</h2>' +
        '<div class="rp-upload-grid">' + slots + '</div>' +
        '<div class="rp-describe">' +
          '<div class="rp-describe__head"><h3>Marketing concept</h3></div>' +
          '<div class="rp-describe__box"><p>A IA escolhe um storyboard oculto desta categoria (' + meta.subtitle + '). O utilizador só vê o vídeo final 9:16.</p></div>' +
        '</div>' +
        (ideasHtml ? '<div class="rp-ideas">' + ideasHtml + '</div>' : '') +
        '<div class="rp-settings-row">' +
          '<div class="rp-setting-card"><span class="rp-setting-card__label">Duration</span></div>' +
          '<button class="rp-setting-card" type="button"><span class="rp-setting-card__label">Output 9:16 · 15s max</span>' + ICONS.chevron + '</button>' +
        '</div>' +
        '<div class="rp-dur-pills" data-dur-pills>' +
          [4, 6, 10, 15].map(function (d, i) {
            return '<button class="rp-dur-pill' + (i === 1 ? ' is-active' : '') + '" type="button" data-dur="' + d + '">' + d + 's</button>';
          }).join('') +
        '</div>' +
      '</div>'
    );
  }

  function initIndex() {
    var wrap = document.querySelector(".wrap");
    if (!wrap) return;

    var cards = Array.prototype.slice.call(document.querySelectorAll(".cat-card"));
    var listHtml = cards.map(function (a) {
      var strong = a.querySelector("strong");
      var span = a.querySelector("span");
      var href = a.getAttribute("href") || "#";
      var slug = href.replace(/\/?index\.html$/, "").replace(/\/$/, "").split("/").pop();
      var meta = CATEGORIES[slug] || { icon: "✦", title: strong ? strong.textContent : "", subtitle: span ? span.textContent : "" };
      return (
        '<a class="rp-cat-item" href="' + href + '">' +
          '<div class="rp-cat-item__icon">' + meta.icon + '</div>' +
          '<div class="rp-cat-item__meta"><strong>' + (strong ? strong.textContent : meta.title) + '</strong><span>' + (span ? span.textContent : meta.subtitle) + '</span></div>' +
          ICONS.chevron +
        '</a>'
      );
    }).join("");

    var phone = el("div", "rp-phone");
    phone.innerHTML =
      topNav() +
      subHeader("Vídeos Marketing IA", "#") +
      '<div class="rp-phone__scroll">' +
        '<div class="rp-content">' +
          '<div class="rp-info rp-keep">' +
            'Cada categoria tem até <strong>10 prompts</strong> ocultos. Durações: <strong>4s · 6s · 10s · 15s</strong> · Formato <strong>9:16</strong>.' +
          '</div>' +
          '<h2 class="rp-section-title">Escolhe a categoria</h2>' +
          '<div class="rp-cat-list">' + listHtml + '</div>' +
        '</div>' +
        '<footer class="rp-footer">RemakePix · Workspace de preview · Integração no site depois de aprovado.</footer>' +
      '</div>';

    var page = el("div", "rp-page");
    page.appendChild(phone);
    document.body.innerHTML = "";
    document.body.appendChild(page);
  }

  function initCategory() {
    var wrap = document.querySelector(".wrap");
    if (!wrap) return;

    var slug = document.body.getAttribute("data-category") || "";
    var meta = CATEGORIES[slug] || { title: "Marketing Video", subtitle: slug, cost: 95, icon: "✦" };

    var ideasSection = wrap.querySelector("section.note");
    var ideasHtml = ideasSection ? ideasSection.innerHTML : "";

    var main = wrap.querySelector("main");
    var footer = wrap.querySelector("footer");
    var infoNote = wrap.querySelector(".note:not(section)");

    wrap.classList.add("is-enhanced");

    var phone = el("div", "rp-phone");
    phone.innerHTML =
      topNav() +
      subHeader("Vídeos Marketing · " + meta.title, "../index.html") +
      '<div class="rp-phone__scroll">' +
        previewSection(meta, ideasHtml) +
        '<div class="rp-content">' +
          (infoNote ? '<div class="rp-info">' + infoNote.innerHTML + '</div>' : '') +
          '<button class="rp-admin-toggle" type="button" aria-expanded="false" data-admin-toggle>' +
            'Editar prompts ocultos <span class="rp-admin-toggle__badge">Admin</span>' +
          '</button>' +
          '<div class="rp-admin-panel" data-admin-panel></div>' +
        '</div>' +
      '</div>' +
      bottomBar(meta.cost);

    var panel = phone.querySelector("[data-admin-panel]");
    if (main) panel.appendChild(main);
    if (footer) {
      footer.classList.add("rp-footer");
      phone.querySelector(".rp-phone__scroll").appendChild(footer);
    }

    var page = el("div", "rp-page");
    page.innerHTML = '<p class="rp-page__label">Preview mobile · ' + meta.title + '</p>';
    page.appendChild(phone);
    document.body.innerHTML = "";
    document.body.appendChild(page);

    bindInteractions(phone);
  }

  function bindInteractions(root) {
    root.querySelectorAll(".rp-mode-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        tab.parentElement.querySelectorAll(".rp-mode-tab").forEach(function (t) {
          t.classList.remove("is-active");
        });
        tab.classList.add("is-active");
      });
    });

    root.querySelectorAll("[data-dur-pills] .rp-dur-pill").forEach(function (pill) {
      pill.addEventListener("click", function () {
        root.querySelectorAll("[data-dur-pills] .rp-dur-pill").forEach(function (p) {
          p.classList.remove("is-active");
        });
        pill.classList.add("is-active");
      });
    });

    var toggle = root.querySelector("[data-admin-toggle]");
    var panel = root.querySelector("[data-admin-panel]");
    if (toggle && panel) {
      toggle.addEventListener("click", function () {
        var open = panel.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    var stepEl = root.querySelector("[data-step-current]");
    if (stepEl) {
      var val = 1;
      root.querySelectorAll("[data-step]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          val = Math.min(4, Math.max(1, val + parseInt(btn.getAttribute("data-step"), 10)));
          stepEl.textContent = String(val);
        });
      });
    }
  }

  if (document.body.classList.contains("rp-index")) {
    initIndex();
  } else if (document.body.getAttribute("data-category")) {
    initCategory();
  }
})();
