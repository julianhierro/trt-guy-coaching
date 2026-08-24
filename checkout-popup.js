/* Buy flow, in two pop-ups, on the sales page itself.
   Start Now → email → order form → thank-you page.

   The email is captured BEFORE the order form so people who don't finish are
   still reachable: they land in GHL tagged checkout-started, and the payment
   side tags the ones who actually pay. The gap between those two tags is the
   follow-up list.

   Everything here is built at runtime and marked data-noedit, so it adds no
   data-eid to the page and can't shift the ids the published edits rely on.
*/
(function () {
  var CFG = {
    formId: "kssznJ84vI4tDgBFgBJX",
    formUrl: "https://api.leadconnectorhq.com/widget/form/kssznJ84vI4tDgBFgBJX",
    submitUrl: "https://trt-guy-site.vercel.app/api/submit",
    formHeight: 620,
    // Anything matching this opens the flow.
    triggers: '#startBtn, a[href$="pay.html"], a[href$="/pay.html"], [data-buy]'
  };

  var CSS = '' +
  '.cp{position:fixed;inset:0;z-index:9600;display:none;align-items:flex-start;justify-content:center;' +
    'padding:24px 16px;background:rgba(11,13,16,.62);overflow-y:auto;-webkit-overflow-scrolling:touch}' +
  '.cp.open{display:flex}' +
  '.cp-box{position:relative;width:100%;max-width:460px;background:#fff;border-radius:16px;' +
    'box-shadow:0 30px 80px rgba(11,13,16,.35);overflow:hidden;margin:auto}' +
  '.cp-box.wide{max-width:560px}' +
  '.cp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;' +
    'padding:18px 20px;border-bottom:1px solid #e8eaee;background:#f7f8fa}' +
  '.cp-t{font:700 15.5px/1.25 Inter,system-ui,sans-serif;color:#0b0d10}' +
  '.cp-s{font:600 12.5px/1.35 Inter,system-ui,sans-serif;color:#5a6270;margin-top:4px}' +
  '.cp-x{flex:none;width:34px;height:34px;border-radius:9px;border:1px solid #e8eaee;background:#fff;' +
    'color:#5a6270;font-size:20px;line-height:1;cursor:pointer}' +
  '.cp-x:hover{background:#f0f2f5;color:#0b0d10}' +
  '.cp-body{padding:22px 20px 24px}' +
  '.cp-body.flush{padding:0;min-height:420px}' +
  '.cp-body.flush iframe{width:100%;border:0;display:block}' +
  '.cp-in{width:100%;box-sizing:border-box;padding:14px 15px;border:1px solid #d7dbe2;border-radius:10px;' +
    'font:400 16px/1.3 Inter,system-ui,sans-serif;color:#0b0d10;background:#fff}' +
  '.cp-in:focus{outline:2px solid #1a5cff;outline-offset:1px;border-color:transparent}' +
  '.cp-go{width:100%;margin-top:12px;padding:15px 20px;border:0;border-radius:10px;background:#1a5cff;' +
    'color:#fff;font:700 16px/1 Inter,system-ui,sans-serif;cursor:pointer}' +
  '.cp-go:hover{background:#0f47d6}.cp-go[disabled]{opacity:.6;cursor:default}' +
  '.cp-err{color:#b91c1c;font:400 14px/1.4 Inter,system-ui,sans-serif;min-height:19px;margin:9px 0 0;text-align:center}' +
  '.cp-note{margin:12px 0 0;color:#5a6270;font:400 12.5px/1.5 Inter,system-ui,sans-serif;text-align:center}' +
  'body.cp-locked{overflow:hidden}' +
  '@media(max-width:560px){.cp{padding:0}.cp-box,.cp-box.wide{max-width:none;min-height:100%;border-radius:0}}';

  var style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  var wrap = document.createElement("div");
  wrap.className = "cp";
  wrap.setAttribute("data-noedit", "");
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-modal", "true");
  wrap.innerHTML =
    '<div class="cp-box" id="cpBox">' +
      '<div class="cp-head">' +
        '<div><div class="cp-t" id="cpT">Start coaching</div>' +
        '<div class="cp-s" id="cpS">$125 per week &middot; cancel any week</div></div>' +
        '<button class="cp-x" type="button" id="cpX" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="cp-body" id="cpBody">' +
        '<form id="cpForm" novalidate>' +
          '<input class="cp-in" id="cpMail" name="email" type="email" placeholder="Enter your email to start" autocomplete="email" inputmode="email">' +
          '<p class="cp-err" id="cpErr"></p>' +
          '<button class="cp-go" id="cpGo" type="submit">Continue to payment &rarr;</button>' +
          '<p class="cp-note">So I can send your receipt and the intake form. Payment details come next.</p>' +
        '</form>' +
      '</div>' +
    '</div>';
  document.body.appendChild(wrap);

  var box = wrap.querySelector("#cpBox"), bodyEl = wrap.querySelector("#cpBody");
  var form = wrap.querySelector("#cpForm"), mail = wrap.querySelector("#cpMail");
  var err = wrap.querySelector("#cpErr"), go = wrap.querySelector("#cpGo");
  var loadedForm = false;

  // Pull the words from the editable block on the page, so Publish changes them.
  function readCopy() {
    var box = document.getElementById("cpCopy");
    if (!box) return;
    function txt(sel) { var e = box.querySelector(sel); return e ? e.textContent.trim() : ""; }
    var t1 = txt(".cp-c-title"), s = txt(".cp-c-sub"), ph = txt(".cp-c-ph"),
        b = txt(".cp-c-btn"), n = txt(".cp-c-note");
    if (t1 && !loadedForm) wrap.querySelector("#cpT").textContent = t1;
    if (s) wrap.querySelector("#cpS").textContent = s;
    if (ph) mail.placeholder = ph;
    if (b && !loadedForm) go.innerHTML = b + " &rarr;";
    var note = wrap.querySelector(".cp-note");
    if (n && note) note.textContent = n;
  }

  function open() {
    readCopy();
    wrap.classList.add("open");
    document.body.classList.add("cp-locked");
    if (!loadedForm) setTimeout(function () { try { mail.focus(); } catch (e) {} }, 60);
    if (window.jvTrack) window.jvTrack("view");
  }
  function close() { wrap.classList.remove("open"); document.body.classList.remove("cp-locked"); }

  function showOrderForm(email) {
    loadedForm = true;
    var box = document.getElementById("cpCopy");
    var t2 = box && box.querySelector(".cp-c-title2");
    wrap.querySelector("#cpT").textContent = t2 ? t2.textContent.trim() : "TRT Guy Online Coaching";
    wrap.querySelector("#cpS").textContent = "$125 per week · cancel any week";
    box.classList.add("wide");
    bodyEl.classList.add("flush");
    bodyEl.innerHTML = "";

    var qs = email ? (CFG.formUrl.indexOf("?") === -1 ? "?" : "&") + "email=" + encodeURIComponent(email) : "";
    var f = document.createElement("iframe");
    f.src = CFG.formUrl + qs;
    f.id = "inline-" + CFG.formId;
    f.title = "Payment";
    f.height = String(CFG.formHeight);
    f.setAttribute("scrolling", "no");
    f.setAttribute("allow", "payment *");
    f.setAttribute("data-layout", "{'id':'INLINE'}");
    f.setAttribute("data-trigger-type", "alwaysShow");
    f.setAttribute("data-activation-type", "alwaysActivated");
    f.setAttribute("data-deactivation-type", "neverDeactivate");
    f.setAttribute("data-form-name", "Payment");
    f.setAttribute("data-layout-iframe-id", "inline-" + CFG.formId);
    f.setAttribute("data-form-id", CFG.formId);
    bodyEl.appendChild(f);

    if (!document.querySelector('script[src*="form_embed.js"]')) {
      var s = document.createElement("script");
      s.src = "https://link.msgsndr.com/js/form_embed.js";
      s.async = true;
      document.body.appendChild(s);
    }
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var email = mail.value.trim();
    err.textContent = "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Please enter a valid email."; mail.focus(); return; }

    var label = go.textContent;
    go.disabled = true; go.textContent = "One moment…";
    try {
      // Their email lands in GHL before the card does, so a drop-off is still reachable.
      await fetch(CFG.submitUrl, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, source: "checkout" }) });
    } catch (e2) { /* a slow CRM must never block the sale */ }
    if (window.jvTrack) window.jvTrack("optin");
    go.disabled = false; go.textContent = label;
    showOrderForm(email);
  });

  wrap.querySelector("#cpX").addEventListener("click", close);
  wrap.addEventListener("click", function (e) { if (e.target === wrap) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

  // Intercept the buy buttons. Capture phase, because the editor also listens.
  document.addEventListener("click", function (e) {
    if (document.body.classList.contains("jv-editing")) return;   // never hijack a click while editing
    var t = e.target && e.target.closest && e.target.closest(CFG.triggers);
    if (!t) return;
    e.preventDefault(); e.stopPropagation();
    open();
  }, true);

  if (/[?&]buy=1/.test(location.search)) open();
})();
