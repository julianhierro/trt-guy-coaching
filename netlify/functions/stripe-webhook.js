/* Stripe tells us when money actually moved. Nothing else is trusted as proof of
   payment — the browser can claim anything.

   On the first successful invoice we tag the contact in GoHighLevel so the
   onboarding sequence can fire.

   Env:
     STRIPE_SECRET_KEY
     STRIPE_WEBHOOK_SECRET   whsec_… from the endpoint you add in Stripe
     GHL_API_KEY             optional — without it, tagging is skipped
     GHL_LOCATION_ID         optional, defaults to the TRT Guy location
*/
const Stripe = require("stripe");

const GHL_LOCATION = process.env.GHL_LOCATION_ID || "WmcafLXT7njeQOu3fqlP";

async function tagInGHL(email, name) {
  const key = process.env.GHL_API_KEY;
  if (!key || !email) return { skipped: true };
  const [firstName, ...rest] = (name || "").trim().split(/\s+/);
  const res = await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Version: "2021-07-28",
    },
    body: JSON.stringify({
      locationId: GHL_LOCATION,
      email,
      firstName: firstName || undefined,
      lastName: rest.join(" ") || undefined,
      tags: ["trt-dad", "coaching-client", "paid-125-weekly"],
    }),
  });
  if (!res.ok) throw new Error("GHL upsert " + res.status + " " + (await res.text()).slice(0, 200));
  return { ok: true };
}

exports.handler = async (event) => {
  const secret = process.env.STRIPE_SECRET_KEY;
  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !whsec) return { statusCode: 500, body: "Stripe env vars are not set." };

  const stripe = new Stripe(secret, { apiVersion: "2024-06-20" });
  const sig = event.headers["stripe-signature"] || event.headers["Stripe-Signature"];

  let evt;
  try {
    // The raw body is required for signature verification — Netlify base64-encodes
    // it when the content type isn't text, so decode before verifying.
    const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body;
    evt = stripe.webhooks.constructEvent(raw, sig, whsec);
  } catch (err) {
    console.error("Bad Stripe signature:", err.message);
    return { statusCode: 400, body: "Signature verification failed." };
  }

  try {
    if (evt.type === "invoice.paid" || evt.type === "invoice.payment_succeeded") {
      const inv = evt.data.object;
      // Only tag on the first paid invoice of a subscription, not every renewal.
      if (inv.billing_reason === "subscription_create") {
        const email = inv.customer_email || (inv.customer_details && inv.customer_details.email);
        const name = (inv.customer_name || "").trim();
        await tagInGHL(email, name);
        console.log("New coaching client tagged:", email);
      } else {
        console.log("Renewal paid:", inv.customer_email, inv.billing_reason);
      }
    } else if (evt.type === "invoice.payment_failed") {
      console.warn("Payment failed for", evt.data.object.customer_email);
    } else if (evt.type === "customer.subscription.deleted") {
      console.log("Subscription cancelled:", evt.data.object.customer);
    }
  } catch (err) {
    // Never 500 on a handled event or Stripe retries it forever; log and move on.
    console.error("Webhook side-effect failed:", err);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
