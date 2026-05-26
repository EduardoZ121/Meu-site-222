"""Remake Pixel migration tests — register=30 credits, padrao 96, pro 20, aspect ratios 6, wizard mapping, generate validation."""
import os
import io
import time
import base64
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://imagine-pixel.preview.emergentagent.com").rstrip("/")

# 1x1 transparent PNG
PNG_1x1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
)


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def fresh_user(s):
    email = f"test_{int(time.time()*1000)}@remakepix.com"
    r = s.post(f"{BASE_URL}/api/auth/register", json={
        "email": email, "password": "Test@2026Remake", "name": "Tester"
    })
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    return {"token": data["token"], "user": data["user"], "email": email}


# ===== Public endpoints =====
class TestPublic:
    def test_aspect_ratios_6_with_21_9(self, s):
        r = s.get(f"{BASE_URL}/api/public/aspect-ratios")
        assert r.status_code == 200
        ratios = r.json()["ratios"]
        assert len(ratios) == 6, f"expected 6 aspect ratios, got {len(ratios)}"
        all_ratios = [x["ratio"] for x in ratios]
        assert "21:9" in all_ratios, f"21:9 missing; got {all_ratios}"

    def test_padrao_styles_96(self, s):
        r = s.get(f"{BASE_URL}/api/public/padrao-styles")
        assert r.status_code == 200
        data = r.json()
        styles = data["styles"]
        assert len(styles) == 96, f"expected 96 padrao styles, got {len(styles)}"
        cats = {st["cat"] for st in styles}
        expected = {"men", "women", "unisex", "flyer", "couple", "comic", "stories", "sensual"}
        missing = expected - cats
        assert not missing, f"missing categories: {missing}; got {cats}"

    def test_pro_presets_20_with_category_and_nome(self, s):
        r = s.get(f"{BASE_URL}/api/public/pro-presets")
        assert r.status_code == 200
        presets = r.json()["presets"]
        assert len(presets) == 20, f"expected 20 pro presets, got {len(presets)}"
        cats = {p["category"] for p in presets}
        assert cats == {"realism", "mood", "enhance"}, f"unexpected cats: {cats}"
        for p in presets:
            assert "nome" in p, f"preset {p.get('id')} missing nome field"


# ===== Auth =====
class TestAuth:
    def test_register_gives_30_credits(self, fresh_user):
        assert fresh_user["user"]["credits"] == 30, (
            f"expected 30 credits on registration, got {fresh_user['user']['credits']}"
        )

    def test_me_returns_30_credits(self, s, fresh_user):
        r = s.get(f"{BASE_URL}/api/auth/me",
                  headers={"Authorization": f"Bearer {fresh_user['token']}"})
        assert r.status_code == 200
        assert r.json()["credits"] == 30


# ===== Wizard =====
class TestWizard:
    def test_compose_numeric_mapping(self, s, fresh_user):
        payload = {"answers": {
            "q1": "4", "q2": "7", "q3": "2",
            "q4": "flying motorcycle in tokyo", "q5": "no"
        }, "lang": "pt"}
        r = s.post(f"{BASE_URL}/api/wizard/compose", json=payload,
                   headers={"Authorization": f"Bearer {fresh_user['token']}"})
        assert r.status_code == 200, f"compose failed: {r.status_code} {r.text}"
        data = r.json()
        assert "prompt" in data and isinstance(data["prompt"], str) and len(data["prompt"]) > 0
        ans = data["answers_resolved"]
        assert ans["q1"] == "character (anime/realistic/cartoon)", f"q1 wrong: {ans.get('q1')}"
        assert ans["q2"] == "cyberpunk / futuristic", f"q2 wrong: {ans.get('q2')}"
        assert ans["q3"] == "1:1", f"q3 wrong: {ans.get('q3')}"


# ===== Generation validation paths =====
class TestGenerateEasy:
    def test_missing_photo_returns_422(self, s, fresh_user):
        r = s.post(
            f"{BASE_URL}/api/generate/easy",
            data={"style_id": "men_underwater", "subject": "the man"},
            headers={"Authorization": f"Bearer {fresh_user['token']}"},
        )
        assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text}"

    def test_bad_style_id_returns_400(self, s, fresh_user):
        files = {"photo": ("p.png", io.BytesIO(PNG_1x1), "image/png")}
        r = s.post(
            f"{BASE_URL}/api/generate/easy",
            data={"style_id": "nonexistent_style_xyz", "subject": "the man"},
            files=files,
            headers={"Authorization": f"Bearer {fresh_user['token']}"},
        )
        assert r.status_code == 400, f"expected 400, got {r.status_code}: {r.text}"
        assert "Unknown style" in r.text

    def test_unauth_returns_401(self, s):
        files = {"photo": ("p.png", io.BytesIO(PNG_1x1), "image/png")}
        r = s.post(
            f"{BASE_URL}/api/generate/easy",
            data={"style_id": "men_underwater"},
            files=files,
        )
        assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code}"


class TestGeneratePro:
    def test_missing_preset_id_returns_422(self, s, fresh_user):
        files = {"photo": ("p.png", io.BytesIO(PNG_1x1), "image/png")}
        r = s.post(
            f"{BASE_URL}/api/generate/pro",
            data={"aspect_ratio": "4:5"},
            files=files,
            headers={"Authorization": f"Bearer {fresh_user['token']}"},
        )
        assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text}"

    def test_bad_preset_id_returns_400(self, s, fresh_user):
        files = {"photo": ("p.png", io.BytesIO(PNG_1x1), "image/png")}
        r = s.post(
            f"{BASE_URL}/api/generate/pro",
            data={"preset_id": "nope_xyz", "aspect_ratio": "4:5"},
            files=files,
            headers={"Authorization": f"Bearer {fresh_user['token']}"},
        )
        assert r.status_code == 400, f"expected 400, got {r.status_code}: {r.text}"


class TestRateLimit:
    def test_wizard_compose_many_ok(self, s, fresh_user):
        # 8 calls; message bucket allows 30/min
        for i in range(8):
            r = s.post(f"{BASE_URL}/api/wizard/compose",
                       json={"answers": {"q1": "1", "q2": "2", "q3": "1", "q4": f"x{i}", "q5": "no"}},
                       headers={"Authorization": f"Bearer {fresh_user['token']}"})
            assert r.status_code == 200, f"call {i} failed: {r.status_code}"
