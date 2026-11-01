"""Independent live acceptance for the AGV dashboard (run after generation)."""
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = "http://127.0.0.1:18765"
AUDIT = ROOT / "_audit" / "20261102-agv-scoped-fixes"
AUDIT.mkdir(parents=True, exist_ok=True)
results = []

def check(name, condition):
    if not condition:
        raise AssertionError(name)
    results.append(name)

def status(path, method="GET"):
    request = urllib.request.Request(BASE + path, method=method)
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            return response.status, response.read(), dict(response.headers)
    except urllib.error.HTTPError as error:
        return error.code, error.read(), dict(error.headers)

code, body, _ = status("/health")
check("server identity", code == 200 and json.loads(body)["app"] == "agv_commands_skills_dashboard")
for method in ("GET", "HEAD"):
    for route in ("/", "/agv_commands_skills_dashboard.html"):
        code, body, headers = status(route, method)
        check(method + " " + route, code == 200 and "text/html" in headers.get("Content-Type", ""))
        if method == "HEAD":
            check("HEAD no body " + route, not body)
    for route in ("/template.html", "/../AGENTS.md", "/%2e%2e/AGENTS.md",
                  "/..%5cAGENTS.md", "/scripts/dashboard_server.py", "/.env"):
        code, _, _ = status(route, method)
        check(method + " blocks " + route, code in (403, 404))

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(permissions=["clipboard-read", "clipboard-write"],
                                  viewport={"width": 1440, "height": 1000})
    page = context.new_page()
    page_errors = []
    console_errors = []
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    page.goto(BASE + "/agv_commands_skills_dashboard.html#sec-builder", wait_until="networkidle")
    check("builder visible", page.locator("#sec-builder").is_visible())
    counts = page.evaluate("({total:ALL_ITEMS.length, skills:ALL_ITEMS.filter(x=>x.cat.startsWith('skill-')).length, source:ALL_ITEMS.filter(x=>x.cat==='skill-global').length})")
    check("visible total tab agrees", str(counts["total"]) in page.locator('[data-cat="ALL"]').inner_text())
    check("visible source tab agrees", str(counts["source"]) in page.locator('[data-cat="skill-global"]').inner_text())
    check("visible navigation count agrees", str(counts["total"]) in page.locator('a[href="#sec-explorer"]').first.inner_text())
    check("search placeholder count agrees", str(counts["skills"]) in page.locator("#builder-skill-search").get_attribute("placeholder"))
    source = Path.home() / ".agents" / "source" / "skills"
    expected_names = set()
    for skill in source.rglob("SKILL.md"):
        if "_backup" in skill.parts or ".cache" in skill.parts:
            continue
        match = re.search(r"^name:\s*([^\n]+)", skill.read_text(encoding="utf-8"), re.MULTILINE)
        check("frontmatter " + str(skill.relative_to(source)), bool(match))
        expected_names.add(match.group(1).strip().strip(chr(34) + chr(39)))
    actual_names = set(page.evaluate("ALL_ITEMS.filter(x => x.cat === 'skill-global').map(x => x.name)"))
    check("all source skills discoverable", expected_names <= actual_names)

    for platform in ("agy_gui", "agy_cli", "claude", "codex", "opencode", "omp"):
        page.locator("#plat-pills-box [data-plat='" + platform + "']").click()
        page.evaluate("""() => {
            selectedSysCmds.push('/this-command-does-not-exist');
            updateBuilder();
        }""")
        state = page.evaluate("""() => ({
            selected: selectedSysCmds,
            output: document.getElementById('builder-out').textContent,
            allowed: SYS_CMDS_BY_PLAT[builderPlat]
        })""")
        check(platform + " filters output", "/this-command-does-not-exist" not in state["output"])
        check(platform + " selection subset", set(state["selected"]) <= set(state["allowed"]))
        page.evaluate("applyPreset(['/goal','/this-command-does-not-exist'], ['workflow-11-phase'], 'acceptance fixture')")
        state = page.evaluate("({selected:selectedSysCmds, allowed:SYS_CMDS_BY_PLAT[builderPlat]})")
        check(platform + " preset subset", set(state["selected"]) <= set(state["allowed"]))

    page.locator("#plat-pills-box [data-plat='codex']").click()
    page.evaluate("selectedSysCmds.push('/goal');updateBuilder()")
    check("Codex excludes GUI goal", "/goal" not in page.locator("#builder-out").inner_text())
    page.locator("#builder-skill-search").fill("unity-navmesh")
    row = page.locator(".skill-picker-row").filter(has_text="/unity-navmesh")
    check("search finds formerly missing skill", row.count() == 1)
    row.click()
    output = page.locator("#builder-out").inner_text()
    check("Codex skill syntax", "$unity-navmesh" in output)
    page.locator('[onclick="copyBuilder()"]').first.click()
    clipboard = page.evaluate("navigator.clipboard.readText()")
    check("copy exact generated prompt", clipboard == output)
    page.locator("#sec-builder").screenshot(path=str(AUDIT / "dashboard-builder-acceptance.png"))
    check("no JavaScript page errors", not page_errors)
    check("no browser console errors", not console_errors)
    browser.close()

receipt = {"passed": len(results), "failures": 0, "checks": results}
(AUDIT / "dashboard-lead-acceptance.json").write_text(json.dumps(receipt, indent=2, ensure_ascii=False), encoding="utf-8")
print(json.dumps({"passed": len(results), "failures": 0}, ensure_ascii=False))
