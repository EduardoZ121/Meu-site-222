"""Remake Pixel — Backend API tests."""
import os
import time
import uuid
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@remakepix.com"
ADMIN_PASS = "Admin@2026Remake"
USER_EMAIL = "test@remakepix.com"
USER_PASS = "Test@2026Remake"


# ===== Fixtures =====
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def user_token(session):
    r = session.post(f"{API}/auth/login", json={"email": USER_EMAIL, "password": USER_PASS})
    assert r.status_code == 200, f"login failed: {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, f"admin login failed: {r.text}"
    return r.json()["token"]


def auth(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ===== Health / Public =====
class TestPublic:
    def test_health(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_public_stats(self, session):
        r = session.get(f"{API}/public/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ("users", "creations", "models"):
            assert k in d

    def test_public_styles(self, session):
        r = session.get(f"{API}/public/styles")
        assert r.status_code == 200
        styles = r.json().get("styles", [])
        assert isinstance(styles, list)
        assert len(styles) >= 30

    def test_public_packages(self, session):
        r = session.get(f"{API}/public/packages")
        assert r.status_code == 200
        pkgs = r.json().get("packages", [])
        ids = {p["id"] for p in pkgs}
        assert {"starter", "creator", "studio"}.issubset(ids)


# ===== Auth =====
class TestAuth:
    def test_register_new_user_50_credits(self, session):
        email = f"TEST_{uuid.uuid4().hex[:10]}@remakepix.com"
        r = session.post(f"{API}/auth/register", json={
            "email": email, "password": "TestPass@2026", "name": "T"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data
        assert data["user"]["credits"] == 50
        assert data["user"]["role"] == "user"
        assert data["user"]["referral_code"]

    def test_register_admin_role(self, session):
        # Re-registering admin should fail (already exists)
        r = session.post(f"{API}/auth/register", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASS, "name": "x"
        })
        assert r.status_code == 400

    def test_login_invalid(self, session):
        r = session.post(f"{API}/auth/login", json={"email": USER_EMAIL, "password": "WRONG"})
        assert r.status_code == 401

    def test_login_valid_user(self, session):
        r = session.post(f"{API}/auth/login", json={"email": USER_EMAIL, "password": USER_PASS})
        assert r.status_code == 200
        assert "token" in r.json()
        assert r.json()["user"]["email"] == USER_EMAIL

    def test_me_with_token(self, session, user_token):
        r = session.get(f"{API}/auth/me", headers=auth(user_token))
        assert r.status_code == 200
        assert r.json()["email"] == USER_EMAIL

    def test_me_without_token(self, session):
        r = session.get(f"{API}/auth/me")
        assert r.status_code in (401, 403)

    def test_admin_has_admin_role(self, session, admin_token):
        r = session.get(f"{API}/auth/me", headers=auth(admin_token))
        assert r.status_code == 200
        assert r.json()["role"] == "admin"


# ===== Credits =====
class TestCredits:
    def test_balance(self, session, user_token):
        r = session.get(f"{API}/credits/balance", headers=auth(user_token))
        assert r.status_code == 200
        assert isinstance(r.json()["credits"], int)

    def test_transactions(self, session, user_token):
        r = session.get(f"{API}/credits/transactions", headers=auth(user_token))
        assert r.status_code == 200
        assert "transactions" in r.json()
        assert isinstance(r.json()["transactions"], list)


# ===== Generation =====
class TestGeneration:
    def test_insufficient_credits_returns_402(self, session):
        # Create a user with 0 credits via register then drain
        email = f"TEST_zero_{uuid.uuid4().hex[:8]}@remakepix.com"
        r = session.post(f"{API}/auth/register", json={
            "email": email, "password": "P@ssw0rd!2026", "name": "Z"
        })
        assert r.status_code == 200
        token = r.json()["token"]
        user_id = r.json()["user"]["id"]
        # admin adjusts credits to -50 to bring to 0
        ar = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
        atoken = ar.json()["token"]
        adj = session.post(f"{API}/admin/credits/adjust", headers=auth(atoken), json={
            "user_id": user_id, "amount": -50, "reason": "TEST drain"
        })
        assert adj.status_code == 200
        # Try generate -> 402
        gr = session.post(f"{API}/generate/image", headers=auth(token), json={
            "prompt": "test cinematic dark portrait", "mode": "advanced",
            "num_outputs": 1, "aspect_ratio": "1:1"
        })
        assert gr.status_code == 402

    @pytest.mark.slow
    def test_advanced_generate_real_replicate(self, session, user_token):
        # Real Replicate call: limit to 1 image
        before = session.get(f"{API}/credits/balance", headers=auth(user_token)).json()["credits"]
        r = session.post(f"{API}/generate/image", headers=auth(user_token), json={
            "prompt": "a serene mountain landscape at dusk",
            "mode": "advanced",
            "num_outputs": 1,
            "aspect_ratio": "1:1",
        }, timeout=120)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "creation" in d
        assert isinstance(d["creation"]["result_urls"], list)
        assert len(d["creation"]["result_urls"]) >= 1
        # credits decremented by 10
        assert d["new_balance"] == before - 10

    def test_history(self, session, user_token):
        r = session.get(f"{API}/generations/history", headers=auth(user_token))
        assert r.status_code == 200
        assert isinstance(r.json()["creations"], list)

    def test_favorite_and_delete(self, session, user_token):
        # Get user's creations
        r = session.get(f"{API}/generations/history?limit=1", headers=auth(user_token))
        creations = r.json()["creations"]
        if not creations:
            pytest.skip("No creations to toggle favorite on")
        cid = creations[0]["id"]
        # Toggle favorite
        r1 = session.post(f"{API}/generations/{cid}/favorite", headers=auth(user_token))
        assert r1.status_code == 200
        first = r1.json()["is_favorite"]
        r2 = session.post(f"{API}/generations/{cid}/favorite", headers=auth(user_token))
        assert r2.json()["is_favorite"] == (not first)

    def test_delete_nonexistent(self, session, user_token):
        r = session.delete(f"{API}/generations/NOPE_{uuid.uuid4().hex}", headers=auth(user_token))
        assert r.status_code == 404


# ===== Stripe =====
class TestStripe:
    def test_checkout_returns_url(self, session, user_token):
        r = session.post(f"{API}/stripe/checkout", headers=auth(user_token),
                         json={"package": "starter"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert "checkout_url" in d
        assert d["checkout_url"].startswith("https://")
        assert "session_id" in d

    def test_checkout_invalid_package(self, session, user_token):
        r = session.post(f"{API}/stripe/checkout", headers=auth(user_token),
                         json={"package": "INVALID_PKG"})
        assert r.status_code in (400, 422, 502)

    def test_webhook_invalid_signature(self, session):
        r = session.post(f"{BASE_URL}/api/webhooks/stripe",
                         headers={"stripe-signature": "bad"}, data=b"{}")
        assert r.status_code == 400


# ===== Admin =====
class TestAdmin:
    def test_non_admin_blocked(self, session, user_token):
        for path in ["/admin/stats", "/admin/users", "/admin/transactions"]:
            r = session.get(f"{API}{path}", headers=auth(user_token))
            assert r.status_code == 403, f"{path}: {r.status_code}"

    def test_admin_stats(self, session, admin_token):
        r = session.get(f"{API}/admin/stats", headers=auth(admin_token))
        assert r.status_code == 200
        d = r.json()
        for k in ("users", "creations", "purchases", "revenue_eur", "credits_in_circulation"):
            assert k in d

    def test_admin_users(self, session, admin_token):
        r = session.get(f"{API}/admin/users", headers=auth(admin_token))
        assert r.status_code == 200
        users = r.json()["users"]
        assert any(u["email"] == ADMIN_EMAIL for u in users)

    def test_admin_credits_adjust(self, session, admin_token):
        # Find the test user id
        r = session.get(f"{API}/admin/users?search=test@remakepix.com", headers=auth(admin_token))
        users = r.json()["users"]
        target = next(u for u in users if u["email"] == USER_EMAIL)
        before = target["credits"]
        adj = session.post(f"{API}/admin/credits/adjust", headers=auth(admin_token), json={
            "user_id": target["id"], "amount": 5, "reason": "TEST adj"
        })
        assert adj.status_code == 200
        assert adj.json()["new_balance"] == before + 5
        # revert
        session.post(f"{API}/admin/credits/adjust", headers=auth(admin_token), json={
            "user_id": target["id"], "amount": -5, "reason": "TEST revert"
        })

    def test_admin_patch_user(self, session, admin_token):
        r = session.get(f"{API}/admin/users?search=test@remakepix.com", headers=auth(admin_token))
        target = next(u for u in r.json()["users"] if u["email"] == USER_EMAIL)
        p = session.patch(f"{API}/admin/users/{target['id']}", headers=auth(admin_token),
                          json={"lang": "pt"})
        assert p.status_code == 200

    def test_admin_transactions(self, session, admin_token):
        r = session.get(f"{API}/admin/transactions", headers=auth(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json()["transactions"], list)
