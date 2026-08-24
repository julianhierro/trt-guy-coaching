/* Drop-in page tracking — works anywhere the HTML ends up, including inside a
   GoHighLevel funnel step or a custom-HTML block.

   Paste ONE line into the page (or into the funnel's Footer Code):

     <script src="https://trt-guy-coaching-edit.netlify.app/track.js"
             data-key="checkout"
             data-goal="#openPay, .btn-buy"></script>

   data-key   the name this page appears under in the Control Center
   data-goal  optional CSS selector; clicking anything matching it counts as a
              conversion for this page. Leave it off to only count views.

   Everything is first-party and anonymous: a random id in localStorage so the
   same person isn't counted twice, plus whatever utm_* the URL carries.
*/
(function () {
  var s = document.currentScript;
  if (!s) return;
  var KEY = s.getAttribute("data-key");
  if (!KEY) return;                       // no key, nothing to attribute
  var GOAL = s.getAttribute("data-goal") || "";
  var API = s.getAttribute("data-api") || "https://jv-dashboard-chi.vercel.app/api/pageview";

  function visitor() {
    try {
      var k = "td-vid", v = localStorage.getItem(k);
      if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(k, v); }
      return v;
    } catch (e) { return "anon"; }
  }
  function utm() {
    var p = new URLSearchParams(location.search), out = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (n) {
      var v = p.get(n); if (v) out += "&" + n + "=" + encodeURIComponent(v);
    });
    return out;
  }
  function send(evt) {
    var u = API + "?p=" + encodeURIComponent(KEY) + "&e=" + evt +
            "&v=" + encodeURIComponent(visitor()) + utm();
    // sendBeacon survives the page being replaced — a plain fetch gets dropped
    // when the click navigates away.
    try { if (navigator.sendBeacon && navigator.sendBeacon(u)) return; } catch (e) {}
    try { new Image().src = u; } catch (e) {}
  }

  // Don't log the owner poking around in an editor or a builder preview.
  var p = new URLSearchParams(location.search);
  if (p.get("edit") === "1" || p.get("view") === "preview") return;
  try { if (window.self !== window.top && !s.hasAttribute("data-count-in-frame")) return; } catch (e) { return; }

  // data-no-view: load the helper for its jvTrack() only, e.g. on a page that
  // already reports its own views — otherwise the page is counted twice.
  if (!s.hasAttribute("data-no-view")) send("view");

  if (GOAL) {
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.closest && t.closest(GOAL)) send("optin");
    }, true);
  }
  window.jvTrack = function (evt) { send(evt || "optin"); };
})();
