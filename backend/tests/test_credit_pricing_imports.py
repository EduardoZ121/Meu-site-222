"""Regression checks for Vercel credit-pricing imports and exports."""

import re
import subprocess
from pathlib import Path


APP_ROOT = Path("/app")
ENTRYPOINT = APP_ROOT / "frontend/api/[...path].js"
CJS_PRICING = APP_ROOT / "frontend/api/lib/creditPricing.cjs"
FRONTEND_PRICING = APP_ROOT / "frontend/src/lib/creditPricing.js"
PRICING_REGIONS = APP_ROOT / "frontend/src/lib/pricingRegions.js"
GENERATE_PAGE = APP_ROOT / "frontend/src/pages/dashboard/Generate.jsx"
SOURCE_SUFFIXES = {".js", ".jsx", ".cjs", ".mjs", ".ts", ".tsx"}
EXCLUDED_PARTS = {"node_modules", "build", "dist", ".git"}


def run_node(source: str) -> subprocess.CompletedProcess[str]:
    """Execute an isolated Node program and capture diagnostics."""
    return subprocess.run(
        ["node", "-e", source],
        cwd=APP_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )


def has_credit_pricing_binding(source: str, symbol: str) -> bool:
    """Return whether a call target is locally defined or imported from creditPricing."""
    definition = re.search(rf"(?:export\s+)?function\s+{symbol}\s*\(", source)
    if definition:
        return True

    es_import = re.search(
        rf"import\s*\{{[^}}]*\b{symbol}\b[^}}]*\}}\s*from\s*[\"'][^\"']*creditPricing[^\"']*[\"']",
        source,
        re.DOTALL,
    )
    commonjs_import = re.search(
        rf"(?:const|let|var)\s*\{{[^}}]*\b{symbol}\b[^}}]*\}}\s*=\s*require\(\s*[\"'][^\"']*creditPricing[^\"']*[\"']\s*\)",
        source,
        re.DOTALL,
    )
    return bool(es_import or commonjs_import)


def call_files(symbol: str) -> list[Path]:
    """Find repository source files containing a call to the requested symbol."""
    matches = []
    call_pattern = re.compile(rf"\b{symbol}\s*\(")
    for path in APP_ROOT.rglob("*"):
        if not path.is_file() or path.suffix not in SOURCE_SUFFIXES:
            continue
        if EXCLUDED_PARTS.intersection(path.parts):
            continue
        source = path.read_text(encoding="utf-8", errors="replace")
        if call_pattern.search(source):
            matches.append(path)
    return sorted(matches)


# Static import/export regression for the production Vercel serverless entrypoint.
def test_serverless_entrypoint_imports_apply_generation_surcharges():
    source = ENTRYPOINT.read_text(encoding="utf-8")
    assert has_credit_pricing_binding(source, "applyGenerationSurcharges")
    assert has_credit_pricing_binding(source, "getSurcharges")


def test_credit_pricing_cjs_defines_and_exports_apply_generation_surcharges():
    source = CJS_PRICING.read_text(encoding="utf-8")
    assert re.search(r"function\s+applyGenerationSurcharges\s*\(", source)
    export_block = re.search(r"module\.exports\s*=\s*\{(?P<body>.*?)\};", source, re.DOTALL)
    assert export_block, "creditPricing.cjs has no module.exports object"
    assert re.search(r"\bapplyGenerationSurcharges\b", export_block.group("body"))
    assert re.search(r"\bgetSurcharges\b", export_block.group("body"))


def test_frontend_import_exports_and_dependency_chain_are_intact():
    generate_source = GENERATE_PAGE.read_text(encoding="utf-8")
    pricing_source = FRONTEND_PRICING.read_text(encoding="utf-8")
    regions_source = PRICING_REGIONS.read_text(encoding="utf-8")

    assert re.search(
        r'import\s*\{\s*applyGenerationSurcharges\s*,\s*getSurcharges\s*\}\s*from\s*"\.\./\.\./lib/creditPricing"',
        generate_source,
    )
    assert re.search(r"export\s+function\s+applyGenerationSurcharges\s*\(", pricing_source)
    assert re.search(r"export\s+function\s+getSurcharges\s*\(", pricing_source)
    assert re.search(r'import\s*\{[^}]*getRegionConfig[^}]*pricingData[^}]*\}\s*from\s*"\./pricingRegions"', pricing_source)
    assert re.search(r'import\s+pricingData\s+from\s*"\.\./config/pricing\.json"', regions_source)
    assert "creditPricing" not in regions_source


# Runtime syntax/module checks for the exact production JavaScript files.
def test_serverless_entrypoint_has_valid_node_syntax():
    result = subprocess.run(
        ["node", "--check", str(ENTRYPOINT)],
        cwd=APP_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr


def test_credit_pricing_runtime_export_and_behavior():
    result = run_node(
        f"""
        const m = require({str(CJS_PRICING)!r});
        if (typeof m.applyGenerationSurcharges !== 'function') process.exit(1);
        const sc = {{ enhancePrompt: 5, hdImage: 8, hdSimple: 5, hdVideo: 15 }};
        const cases = [
          [15, {{}}, 15],
          [15, {{ improvePrompt: true }}, 20],
          [15, {{ hdQuality: true }}, 23],
          [15, {{ improvePrompt: true, hdQuality: true }}, 28],
          [15, {{ hdQuality: true, hdMode: 'simple' }}, 20],
          [15, {{ hdQuality: true, hdMode: 'video' }}, 30],
        ];
        for (const [base, opts, expected] of cases) {{
          const actual = m.applyGenerationSurcharges(base, sc, opts);
          if (actual !== expected) throw new Error(`Expected ${{expected}}, got ${{actual}}`);
        }}
        """
    )
    assert result.returncode == 0, result.stdout + result.stderr


def test_fresh_entrypoint_load_has_no_apply_generation_surcharges_reference_error():
    result = run_node(
        f"""
        try {{
          require({str(ENTRYPOINT)!r});
        }} catch (error) {{
          const stack = String(error && (error.stack || error));
          console.error(stack);
          if (/ReferenceError:.*applyGenerationSurcharges|applyGenerationSurcharges is not defined/.test(stack)) {{
            process.exit(2);
          }}
        }}
        """
    )
    diagnostics = result.stdout + result.stderr
    assert result.returncode == 0, diagnostics
    assert "applyGenerationSurcharges is not defined" not in diagnostics


# Repository-wide call-site audit for both pricing helpers.
def test_all_apply_generation_surcharge_calls_have_a_binding():
    files = call_files("applyGenerationSurcharges")
    assert files, "No applyGenerationSurcharges call sites found"
    missing = [
        str(path)
        for path in files
        if not has_credit_pricing_binding(
            path.read_text(encoding="utf-8"), "applyGenerationSurcharges"
        )
    ]
    assert not missing, f"Unbound applyGenerationSurcharges calls: {missing}"


def test_all_get_surcharges_calls_have_a_binding():
    files = call_files("getSurcharges")
    assert files, "No getSurcharges call sites found"
    missing = [
        str(path)
        for path in files
        if not has_credit_pricing_binding(
            path.read_text(encoding="utf-8"), "getSurcharges"
        )
    ]
    assert not missing, f"Unbound getSurcharges calls: {missing}"
