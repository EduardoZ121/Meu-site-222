"""Extracts the source-of-truth dictionaries from the original Telegram bot
file (bot.py) and regenerates the backend prompt catalogs:

  - padrao_styles.py
  - artistic_styles.py
  - pro_presets.py
  - poster_templates.py (templates only, header preserved)

Run from /app/backend:
    python3 scripts/extract_bot_dicts.py /path/to/bot.py

The bot.py file is parsed with AST so we never execute Telegram imports.
Only literal dict/set/string assignments at module level are evaluated in
an isolated namespace.
"""
import ast
import pickle
import pprint
import sys
from pathlib import Path

WANTED = {
    "PRO_PRESETS", "PRO_REALISM_EXTRA", "PRO_STYLE_MOOD", "PRO_ENHANCEMENTS",
    "PADRAO_STYLES", "_IDENT_TRAIL", "_LOCKED_PREMIUM_KEYS",
    "PADRAO_UNISEX_GROUPS", "PADRAO_STORIES", "FREE_SENSUAL_KEYS",
    "ESTILOS_ARTISTICOS",
}

CAT_MAP = {
    "anime": "anime", "ghibli": "anime", "manga": "anime", "anime_50s": "anime",
    "disney_2d": "cartoon", "disney_3d": "cartoon", "cartoon": "cartoon",
    "cute_3d": "cartoon", "claymation": "cartoon",
    "pokemon_2d": "cartoon", "pokemon_3d": "cartoon",
    "comic": "comic", "pop_art": "comic",
    "cyberpunk": "fantasy", "retrowave": "fantasy", "fantasy": "fantasy",
    "steampunk": "fantasy", "neon_glow": "fantasy", "gothic": "fantasy",
    "pixel_art": "other", "sketch": "paint", "watercolor": "paint",
    "oil_paint": "paint", "digital_art": "paint", "concept_art": "paint",
    "ukiyoe": "paint", "art_nouveau": "paint", "splatter": "paint",
    "tattoo": "other", "vintage": "vintage", "grain": "vintage",
    "woodcarving": "other", "furry": "other",
}

ART_CATEGORIES = {
    "anime": "Anime & Manga",
    "cartoon": "Cartoon & Disney",
    "comic": "Comic & Ilustração",
    "fantasy": "Fantasy & Sci-Fi",
    "paint": "Pintura Tradicional",
    "vintage": "Vintage & Retro",
    "other": "Outros",
}

GROUP_LABELS = {
    "classic": "Clássicos", "lion": "Trilogia Leão", "phone": "Music Phone",
    "editorial": "Editorial Pôster", "bw": "B&W Studio", "hacker": "Hacker Noir",
    "crimson": "Trilogia Carmesim", "neon": "Neon Warrior", "emotion": "Emoção",
    "skin": "Pele Extrema", "submerged": "Olhar Submerso", "vintage": "Beetle Vintage",
    "hero": "Hero Editorial", "lifestyle": "Lifestyle", "epic": "Epic Posters",
    "scifi": "Sci-Fi", "split": "Split Lifestyle", "fitness": "Fitness",
    "recruit": "Recruitment", "polaroid": "Polaroid",
    "shadows": "Comics — Shadows", "journey": "Comics — Journey",
}

# Poster-like style ids by group/category in the bot
POSTER_BUCKETS = [
    ("flyer", "4:5", ["fl_general", "fl_tech", "fl_corporate",
                       "fl_fitness", "fl_restaurant", "fl_creative"]),
    ("editorial", "4:5", ["u_ed_future", "u_ed_modern"]),
    ("epic", "4:5", ["u_ep_sorcerer", "u_ep_grid_classic",
                     "u_ep_grid_dark", "u_ep_grid_lux", "u_ep_grid_street"]),
    ("scifi", "4:5", ["u_sf_cyber", "u_sf_cybergoth"]),
    ("hero", "4:5", ["u_he_cine"]),
    ("phone", "9:16", ["u_phone_spotify", "u_phone_neon",
                        "u_phone_apple", "u_phone_street"]),
]


def extract(bot_path: Path) -> dict:
    src = bot_path.read_text()
    tree = ast.parse(src)
    ns = {}
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for t in node.targets:
                if isinstance(t, ast.Name) and t.id in WANTED:
                    code = compile(ast.Expression(node.value), "<bot>", "eval")
                    try:
                        ns[t.id] = eval(code, ns)
                    except Exception as e:  # pragma: no cover
                        print(f"WARN: failed to eval {t.id}: {e}")
    missing = WANTED - ns.keys()
    if missing:
        raise RuntimeError(f"Missing dicts in bot.py: {missing}")
    return ns


def write_padrao_styles(out: Path, data: dict):
    body = [
        '"""Padrão Lisboa style catalog — generated verbatim from bot.py.\n'
        "\nDo NOT hand-edit. Run scripts/extract_bot_dicts.py to regenerate.\n"
        '"""\n\n',
        f"_IDENT_TRAIL = {data['_IDENT_TRAIL']!r}\n\n",
        "PADRAO_STYLES = "
        + pprint.pformat(data["PADRAO_STYLES"], indent=2, width=120, sort_dicts=False) + "\n\n",
        "PADRAO_UNISEX_GROUPS = "
        + pprint.pformat(data["PADRAO_UNISEX_GROUPS"], indent=2, width=120, sort_dicts=False) + "\n\n",
        "PADRAO_STORIES = "
        + pprint.pformat(data["PADRAO_STORIES"], indent=2, width=120, sort_dicts=False) + "\n\n",
        f"LOCKED_PREMIUM_KEYS = {sorted(data['_LOCKED_PREMIUM_KEYS'])!r}\n\n",
        f"FREE_SENSUAL_KEYS = {sorted(data['FREE_SENSUAL_KEYS'])!r}\n\n",
        "GROUP_LABELS = "
        + pprint.pformat(GROUP_LABELS, indent=2, width=120, sort_dicts=False) + "\n\n",
        "def get_padrao(style_id: str):\n    return PADRAO_STYLES.get(style_id)\n\n\n"
        "def list_categories():\n    cats = {}\n    for k, v in PADRAO_STYLES.items():\n"
        "        cats.setdefault(v.get(\"cat\", \"other\"), []).append(k)\n    return cats\n",
    ]
    out.write_text("".join(body))


def write_artistic_styles(out: Path, data: dict):
    items = [
        {"id": k, "label": v.get("nome", k), "cat": CAT_MAP.get(k, "other"),
         "suffix": v.get("prompt", "")}
        for k, v in data["ESTILOS_ARTISTICOS"].items()
    ]
    body = (
        '"""Artistic styles — generated verbatim from bot.py ESTILOS_ARTISTICOS.\n'
        "\nDo NOT hand-edit. Run scripts/extract_bot_dicts.py to regenerate.\n"
        '"""\n\n'
        "CATEGORIES = " + pprint.pformat(ART_CATEGORIES, indent=2, width=120, sort_dicts=False) + "\n\n"
        "ARTISTIC_STYLES = " + pprint.pformat(items, indent=2, width=120, sort_dicts=False) + "\n\n\n"
        "def get_artistic(style_id: str):\n"
        "    for s in ARTISTIC_STYLES:\n"
        "        if s[\"id\"] == style_id:\n"
        "            return s\n"
        "    return None\n"
    )
    out.write_text(body)


def write_pro_presets(out: Path, data: dict):
    combined = {}
    for d in ("PRO_PRESETS", "PRO_REALISM_EXTRA", "PRO_STYLE_MOOD", "PRO_ENHANCEMENTS"):
        for k, v in data[d].items():
            # tag with the group so the API can build sub-menus later
            cat = {
                "PRO_PRESETS": "realism",
                "PRO_REALISM_EXTRA": "realism",
                "PRO_STYLE_MOOD": "mood",
                "PRO_ENHANCEMENTS": "enhance",
            }[d]
            combined[k] = {**v, "category": cat}
    body = (
        '"""Pro presets — generated verbatim from bot.py.\n'
        "\nMerges PRO_PRESETS + PRO_REALISM_EXTRA + PRO_STYLE_MOOD + PRO_ENHANCEMENTS.\n"
        "Do NOT hand-edit. Run scripts/extract_bot_dicts.py to regenerate.\n"
        '"""\n\n'
        "PRO_PRESETS = " + pprint.pformat(combined, indent=2, width=120, sort_dicts=False) + "\n\n\n"
        "def get_pro_preset(preset_id: str):\n"
        "    return PRO_PRESETS.get(preset_id)\n"
    )
    out.write_text(body)


def write_poster_templates(out: Path, data: dict):
    ps = data["PADRAO_STYLES"]
    templates = []
    for category, aspect, ids in POSTER_BUCKETS:
        for k in ids:
            v = ps[k]
            tpl = {
                "id": k,
                "category": category,
                "label": v["nome"],
                "placeholders": [],  # bot prompts are fixed; no user variables
                "prompt": v["prompt"].replace("[subject]", "the person"),
                "aspect": aspect,
            }
            if v.get("locked"):
                tpl["locked"] = True
            templates.append(tpl)

    cur = out.read_text() if out.exists() else ""
    idx = cur.find("POSTER_TEMPLATES = [")
    header = cur[:idx] if idx > 0 else (
        '"""Poster templates — generated from bot.py PADRAO_STYLES flyers/editorial/epic/scifi/hero/phone groups."""\n\n'
        "POSTER_DIRECTOR = ''\n"
        "MOOD_EXPANSIONS = {}\n\n"
    )
    body = (
        header
        + "POSTER_TEMPLATES = "
        + pprint.pformat(templates, indent=2, width=140, sort_dicts=False)
        + "\n\n\ndef get_poster(template_id: str):\n"
          "    for t in POSTER_TEMPLATES:\n"
          "        if t[\"id\"] == template_id:\n"
          "            return t\n"
          "    return None\n"
    )
    out.write_text(body)


def main():
    if len(sys.argv) < 2:
        print("usage: extract_bot_dicts.py <bot.py>")
        sys.exit(1)
    bot_path = Path(sys.argv[1]).resolve()
    if not bot_path.exists():
        sys.exit(f"bot.py not found: {bot_path}")
    backend_dir = Path(__file__).resolve().parent.parent
    print(f"Reading {bot_path}")
    data = extract(bot_path)
    print(f"Extracted: " + ", ".join(f"{k}={len(v) if hasattr(v, '__len__') else '?'}" for k, v in data.items()))

    write_padrao_styles(backend_dir / "padrao_styles.py", data)
    write_artistic_styles(backend_dir / "artistic_styles.py", data)
    write_pro_presets(backend_dir / "pro_presets.py", data)
    write_poster_templates(backend_dir / "poster_templates.py", data)

    # Persist a snapshot for testing & regression
    with open(backend_dir / "scripts" / ".bot_dicts.pkl", "wb") as f:
        pickle.dump(data, f)
    print("Wrote padrao_styles.py, artistic_styles.py, pro_presets.py, poster_templates.py")


if __name__ == "__main__":
    main()
