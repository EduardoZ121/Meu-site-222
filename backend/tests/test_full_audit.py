"""
Full pre-launch audit tests for Remake Pixel backend.
Covers: health, public endpoints, auth (admin), credits, generations history,
billing/packs, referral stats, and admin endpoints.
NOTE: No paid generations are triggered here.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://imagine-pixel.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@remakepix.com"
ADMIN_PASS = "Admin@2026Remake"
TEST_EMAIL = "test@remakepix.com"
TEST_PASS = "Test@2026Remake"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=20)
    assert r.status_code == 200, f"admin login failed {r.status_code} {r.text[:200]}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_auth(session, admin_token):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"})
    return s


# ---------------- Public ----------------
class TestPublic:
    def test_health(self, session):
        r = session.get(f"{BASE_URL}/api/health", timeout=15)
        assert r.status_code == 200

    def test_root(self, session):
        r = session.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200

    @pytest.mark.parametrize("path", [
        "/api/public/pricing", "/api/public/stats", "/api/public/styles",
        "/api/public/artistic-styles", "/api/public/pro-presets",
        "/api/public/poster-templates", "/api/public/wizard-steps",
        "/api/public/padrao-styles", "/api/public/visual-styles",
        "/api/public/aspect-ratios", "/api/public/wizard-questions",
        "/api/public/personalities", "/api/public/packages",
        "/api/public/poster-models",
    ])
    def test_public_endpoint(self, session, path):
        r = session.get(f"{BASE_URL}{path}", timeout=15)
        assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"
        # ensure JSON-parseable
        r.json()

    def test_explore(self, session):
        r = session.get(f"{BASE_URL}/api/explore", timeout=15)
        assert r.status_code == 200


# ---------------- Auth ----------------
class TestAuth:
    def test_admin_login(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert data["user"]["email"] == ADMIN_EMAIL

    def test_test_user_login(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASS}, timeout=20)
        # test user may or may not exist — if not, try to register
        if r.status_code != 200:
            reg = session.post(f"{BASE_URL}/api/auth/register", json={"email": TEST_EMAIL, "password": TEST_PASS, "name": "Test"}, timeout=20)
            assert reg.status_code in (200, 201, 400, 409), f"register {reg.status_code} {reg.text[:200]}"

    def test_me(self, admin_auth):
        r = admin_auth.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL

    def test_check_email(self, session):
        r = session.get(f"{BASE_URL}/api/auth/check-email", params={"email": ADMIN_EMAIL}, timeout=15)
        assert r.status_code in (200, 422)

    def test_login_wrong_password(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code in (400, 401, 403)


# ---------------- Credits / Generations / Billing ----------------
class TestUserData:
    def test_credits_balance(self, admin_auth):
        r = admin_auth.get(f"{BASE_URL}/api/credits/balance", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "balance" in d or "credits" in d

    def test_credits_transactions(self, admin_auth):
        r = admin_auth.get(f"{BASE_URL}/api/credits/transactions", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), (list, dict))

    def test_generations_history(self, admin_auth):
        r = admin_auth.get(f"{BASE_URL}/api/generations/history", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, (list, dict))

    def test_generations_pending(self, admin_auth):
        r = admin_auth.get(f"{BASE_URL}/api/generations/pending", timeout=15)
        assert r.status_code == 200

    def test_settings_get(self, admin_auth):
        r = admin_auth.get(f"{BASE_URL}/api/settings", timeout=15)
        assert r.status_code == 200

    def test_referrals_stats(self, admin_auth):
        r = admin_auth.get(f"{BASE_URL}/api/me/referrals/stats", timeout=15)
        assert r.status_code == 200


# ---------------- Admin endpoints ----------------
class TestAdmin:
    def test_admin_stats(self, admin_auth):
        r = admin_auth.get(f"{BASE_URL}/api/admin/stats", timeout=15)
        assert r.status_code == 200

    def test_admin_users(self, admin_auth):
        r = admin_auth.get(f"{BASE_URL}/api/admin/users", timeout=15)
        assert r.status_code == 200

    def test_admin_transactions(self, admin_auth):
        r = admin_auth.get(f"{BASE_URL}/api/admin/transactions", timeout=15)
        assert r.status_code == 200

    def test_admin_purchases(self, admin_auth):
        r = admin_auth.get(f"{BASE_URL}/api/admin/purchases", timeout=15)
        assert r.status_code == 200

    def test_admin_finance(self, admin_auth):
        r = admin_auth.get(f"{BASE_URL}/api/admin/finance", timeout=15)
        assert r.status_code == 200

    def test_admin_ip_groups(self, admin_auth):
        r = admin_auth.get(f"{BASE_URL}/api/admin/ip-groups", timeout=15)
        assert r.status_code == 200


# ---------------- Validation paths ----------------
class TestValidation:
    def test_generate_easy_unauth(self, session):
        r = session.post(f"{BASE_URL}/api/generate/easy", json={}, timeout=15)
        assert r.status_code in (401, 403, 422)

    def test_generate_pro_missing_preset(self, admin_auth):
        r = admin_auth.post(f"{BASE_URL}/api/generate/pro", json={"photo": "x"}, timeout=15)
        assert r.status_code in (400, 422)


# ---------------- Fix verification (iteration 5) ----------------
class TestFixes:
    def test_proxy_media_bad_host(self, session):
        # Non-whitelisted host must be rejected with 400
        r = session.get(f"{BASE_URL}/api/generations/proxy-media", params={"u": "https://evil.example.com/a.jpg"}, timeout=15)
        assert r.status_code == 400, f"expected 400, got {r.status_code} {r.text[:200]}"

    def test_proxy_media_missing_param(self, session):
        r = session.get(f"{BASE_URL}/api/generations/proxy-media", timeout=15)
        # missing u param -> 400 or 422
        assert r.status_code in (400, 422)

    def test_proxy_media_valid_host(self, session):
        # A whitelisted host (replicate.delivery) — even if the resource itself
        # doesn't exist, validation should succeed. Accept 2xx (image bytes) OR
        # any upstream failure (404/502/504/410). Critically NOT 400 / 405.
        r = session.get(
            f"{BASE_URL}/api/generations/proxy-media",
            params={"u": "https://replicate.delivery/pbxt/doesnotexist/test.png"},
            timeout=20,
        )
        assert r.status_code not in (400, 405), f"host validation/route wrong: {r.status_code}"

    def test_generation_media_endpoint_shape(self, admin_auth):
        # Find an existing generation id
        r = admin_auth.get(f"{BASE_URL}/api/generations/history", timeout=20)
        assert r.status_code == 200
        data = r.json()
        items = data if isinstance(data, list) else data.get("creations") or data.get("items") or data.get("generations") or []
        if not items:
            pytest.skip("no generations to test media endpoint")
        gid = items[0].get("id") or items[0].get("_id") or items[0].get("generation_id")
        if not gid:
            pytest.skip("could not determine generation id")
        r2 = admin_auth.get(f"{BASE_URL}/api/generations/{gid}/media", timeout=30, allow_redirects=False)
        # binary bytes (2xx) OR redirect OR 404/410 for missing media — but NOT 405 nor a JSON body claiming bytes
        assert r2.status_code in (200, 204, 301, 302, 404, 410, 502, 504), f"unexpected {r2.status_code}"
        if r2.status_code == 200:
            ctype = r2.headers.get("content-type", "")
            assert ctype.startswith("image/") or "octet-stream" in ctype, f"expected binary, got {ctype}"
