/* Creates the customer and the weekly subscription, and hands the page back a
   client secret so the card can be confirmed in the browser.

   The card number never touches this function or the page's own JavaScript —
   Stripe's Payment Element keeps it inside Stripe-hosted iframes. All this does
   is set up what is being charged.

   Env (set in Netlify → Site settings → Environment variables):
     STRIPE_SECRET_KEY       sk_test_… while testing, sk_live_… when you go live
     STRIPE_PUBLISHABLE_KEY  pk_test_… / pk_live_… (safe to expose; returned below)
     STRIPE_PRICE_ID         the $125/week recurring price
     TRIAL_DAYS              optional, e.g. "7" — not used unless set
*/
const Stripe = require("stripe");

const json = (status, body) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod === "GET") {
    // The page asks for its publishable key on load, so no key is ever pasted
    // into the HTML and switching test → live is one env var, not a code edit.
    const pk = process.env.STRIPE_PUBLISHABLE_KEY;
    if (!pk) return json(500, { error: "STRIPE_PUBLISHABLE_KEY is not set on this site." });
    return json(200, { publishableKey: pk, live: pk.startsWith("pk_live_") });
  }
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!secret) return json(500, { error: "STRIPE_SECRET_KEY is not set on this site." });
  if (!priceId) return json(500, { error: "STRIPE_PRICE_ID is not set on this site." });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch (e) { return json(400, { error: "Bad JSON" }); }

  const email = String(body.email || "").trim();
  const name = String(body.name || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "A valid email is required." });

  const stripe = new Stripe(secret, { apiVersion: "2024-06-20" });

  try {
    // Reuse a customer if this email already exists, so repeat attempts don't
    // pile up duplicates in Stripe.
    const found = await stripe.customers.list({ email, limit: 1 });
    const customer = found.data[0] || await stripe.customers.create({
      email, name: name || undefined, metadata: { source: "trt-guy-coaching" },
    });

    const trialDays = parseInt(process.env.TRIAL_DAYS || "", 10);
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: { source: "trt-guy-coaching", name },
      ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
    });

    const intent = subscription.latest_invoice && subscription.latest_invoice.payment_intent;
    if (!intent || !intent.client_secret) {
      return json(500, { error: "Stripe did not return a payment intent. Check that the price is recurring." });
    }

    return json(200, {
      clientSecret: intent.client_secret,
      subscriptionId: subscription.id,
      customerId: customer.id,
    });
  } catch (err) {
    // Stripe's own message is the useful one; log the rest for the function log.
    console.error("create-subscription failed:", err);
    return json(400, { error: err.message || "Could not start the subscription." });
  }
};
