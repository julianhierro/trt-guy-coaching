# Deploying

Both projects are GitHub Pages sites. There is no build step and no deploy limit —
pushing to `master` publishes, usually within a minute.

    git add -A
    git commit -m "what changed"
    git push

    trt-guy-coaching  →  https://julianhierro.github.io/trt-guy-coaching/
    trt-guy-control   →  https://julianhierro.github.io/trt-guy-control/

## What lives where

    index.html          the coaching sales page (editable, store td-coaching-gate)
    pay.html            standalone checkout          (editable, store td-checkout)
    thanks.html         after payment                (editable, store td-thanks)
    checkout-popup.js   Start Now → email → GHL order form, built at runtime
    track.js            drop-in page tracking; works on any host, including GHL
    editor.js/.css      the inline editor, loaded only with ?edit=1

## Editing

Open the Control Center and hit Edit, or add `?edit=1` to any page. Publishing
writes to the content store, not to git — so published copy changes survive a
push, and a push doesn't overwrite them.

## Things that are NOT on GitHub Pages

Static hosting only, so there are no serverless functions here:

  * the GHL form proxy still runs at https://trt-guy-site.vercel.app/api/submit
  * the Stripe fallback in pay.html expects Netlify functions and will show its
    setup note instead. Unused while payment goes through the GHL form.

## Old hosts

Netlify (trt-guy-coaching-edit, trt-guy-control) and Vercel (trt-guy-*) still
serve older copies. Retire or redirect them so nobody tests a stale page.
