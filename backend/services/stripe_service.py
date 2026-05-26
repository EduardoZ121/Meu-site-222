"""Stripe Checkout + Webhooks service."""
import os
import stripe

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "").strip()
WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "").strip()

PACKAGES = {
    "starter": {"name": "Starter", "amount_cents": 500, "credits": 120, "tagline": "A weekend of experimentation"},
    "creator": {"name": "Creator", "amount_cents": 1200, "credits": 350, "tagline": "A month of consistent output"},
    "studio":  {"name": "Studio",  "amount_cents": 2200, "credits": 600, "tagline": "Pro workflows, no ceiling"},
}


def create_checkout_session(user_id: str, package: str, success_url: str, cancel_url: str, customer_email: str | None = None) -> dict:
    if package not in PACKAGES:
        raise ValueError(f"Unknown package: {package}")
    pkg = PACKAGES[package]
    session = stripe.checkout.Session.create(
        mode="payment",
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "eur",
                "unit_amount": pkg["amount_cents"],
                "product_data": {
                    "name": f"Remake Pixel — {pkg['name']} ({pkg['credits']} credits)",
                    "description": pkg["tagline"],
                },
            },
            "quantity": 1,
        }],
        success_url=success_url + "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=cancel_url,
        customer_email=customer_email,
        metadata={
            "user_id": user_id,
            "package": package,
            "credits": str(pkg["credits"]),
        },
    )
    return {
        "session_id": session.id,
        "url": session.url,
        "amount_eur": pkg["amount_cents"] / 100,
        "credits": pkg["credits"],
        "package": package,
    }


def verify_webhook(body: bytes, signature: str):
    return stripe.Webhook.construct_event(body, signature, WEBHOOK_SECRET)
