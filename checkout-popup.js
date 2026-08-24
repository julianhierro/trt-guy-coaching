/* Buy flow: Start Now → email → GHL order form → thank-you page.

   The pop-up's mark-up lives in the page (see #cpModal) rather than being built
   here, so it can be opened and edited in place exactly as visitors see it.
   This file only wires the behaviour.
*/
(function () {
  var CFG = {
    formId: "kssznJ84vI4tDgBFgBJX",
    formUrl: "https://api.leadconnectorhq.com/widget/form/kssznJ84vI4tDgBFgBJX",
    submitUrl: "https://trt-guy-site.vercel.app/api/submit",
    formHeight: 620,
    triggers: '#startBtn, a[href$="pay.html"], [data-buy]'
  };

  var wrap = document.getElementById("cpModal");
  if (!wrap) return;
  var box  = wrap.querySelector("#cpBox");
  var bodyEl = wrap.querySelector("#cpBody");
  var form = wrap.querySelector("#cpForm");
  var mail = wrap.querySelector("#cpMail");
  var err  = wrap.querySelector("#cpErr");
  var go   = wrap.querySelector("#cpGo");
  var headT = wrap.querySelector("#cpT");
  var loadedForm = false;
  var savedEmailPane = null;          // so the editor can always get back to it

  function editing() { return document.body.classList.contains("jv-editing"); }

  function open() {
    wrap.classList.add("open");
    if (!editing()) {
      document.body.classList.add("cp-locked");
      setTimeout(function () { try { mail.focus(); } catch (e) {} }, 60);
      if (window.jvTrack) window.jvTrack("view");
    } else {
      wrap.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }
  function close() {
    wrap.classList.remove("open");
    document.body.classList.remove("cp-locked");
  }

  function showOrderForm(email) {
    if (!savedEmailPane) savedEmailPane = bodyEl.innerHTML;
    loadedForm = true;
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
    // In the editor the pop-up is a thing you're styling, not a form you're filling.
    if (editing()) { return; }

    var email = mail.value.trim();
    err.textContent = "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Please enter a valid email."; mail.focus(); return; }

    var label = go.innerHTML;
    go.disabled = true; go.textContent = "One moment…";
    try {
      // Their email reaches the CRM before the card does, so a drop-off is still reachable.
      await fetch(CFG.submitUrl, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, source: "checkout" }) });
    } catch (e2) { /* a slow CRM must never block the sale */ }
    if (window.jvTrack) window.jvTrack("optin");
    go.disabled = false; go.innerHTML = label;
    showOrderForm(email);
  });

  wrap.querySelector("#cpX").addEventListener("click", close);
  wrap.addEventListener("click", function (e) { if (e.target === wrap && !editing()) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

  // Capture phase, because the editor listens on document too.
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest && e.target.closest(CFG.triggers);
    if (!t) return;
    e.preventDefault(); e.stopPropagation();
    open();          // in the editor this reveals it in the page, ready to edit
  }, true);

  if (/[?&]buy=1/.test(location.search)) open();
})();
