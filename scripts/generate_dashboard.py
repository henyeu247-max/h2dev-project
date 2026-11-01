import os
import re
import json

TEMPLATE_PATH = os.path.normpath(r"D:\YTB\H2DEV-Project\docs\dashboard\template.html")
OUTPUT_PATH = os.path.normpath(r"D:\YTB\H2DEV-Project\docs\dashboard\agv_commands_skills_dashboard.html")
BRAIN_PATH = os.path.normpath(r"C:\Users\SaxukeB\.gemini\antigravity-cli\brain\86ed65d1-ea45-48e7-9698-cfd469842f45\agv_commands_skills_dashboard.html")
SRC_SKILLS_DIR = os.path.normpath(r"C:\Users\SaxukeB\.agents\source\skills")
MANIFEST_PATH = os.path.normpath(r"C:\Users\SaxukeB\.agents\sync\manifest.json")

GUI_NATIVE_COMMANDS = {"/plan", "/boost", "/goal", "/teamwork", "/grill-me", "/browser", "/compact", "/learn"}

def extract_frontmatter(skill_md_path):
    desc = ""
    name = os.path.basename(os.path.dirname(skill_md_path))
    try:
        with open(skill_md_path, "r", encoding="utf-8") as f:
            content = f.read()
        m = re.search(r"^---\s*\n([\s\S]*?)\n---", content)
        if m:
            fm = m.group(1)
            name_m = re.search(r"^name:\s*([^\n]+)", fm, re.MULTILINE)
            if name_m:
                name = name_m.group(1).strip()
            desc_m = re.search(r"^description:\s*([^\n]+(?:\n\s+[^\n]+)*)", fm, re.MULTILINE)
            if desc_m:
                desc = re.sub(r"\s+", " ", desc_m.group(1).strip()).lstrip(">-").strip()
    except Exception as e:
        print(f"Error reading {skill_md_path}: {e}")
    return name, desc

def load_codex_exclusions(manifest_path=MANIFEST_PATH):
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            m = json.load(f)
        for t in m.get("skills", {}).get("targets", []):
            if t.get("id") == "codex":
                return set(t.get("exclude_names", []))
    except Exception as e:
        print(f"Warning: could not read manifest exclusions: {e}")
    return set()

def scan_all_source_skills(src_skills_dir=SRC_SKILLS_DIR):
    skills = []
    codex_exclusions = load_codex_exclusions()

    for root, dirs, files in os.walk(src_skills_dir):
        if "_backup" in root or ".cache" in root:
            continue
        if "SKILL.md" in files:
            md_path = os.path.join(root, "SKILL.md")
            name, desc = extract_frontmatter(md_path)
            rel_dir = os.path.relpath(root, src_skills_dir)
            parts = rel_dir.split(os.sep)

            is_top_level = (len(parts) == 1)
            if is_top_level:
                subcat = "Kỹ Năng Chung Toàn Hệ Thống (~/.agents/source/skills)"
                badge = "Global Skill · SSoT"
                when = f"Kỹ năng chuẩn toàn hệ thống {name}."
            else:
                parent_pkg = parts[0]
                subcat = f"Sub-skill Quy Trình ({parent_pkg})"
                badge = f"Sub-Skill · {parent_pkg}"
                when = f"Sub-skill quy trình con được gọi thông qua kỹ năng cha {parent_pkg}."

            plats = ["AGY", "Claude"]
            if name in codex_exclusions:
                plats.append("Codex (plugin-native)")
                alias = f"${name} (plugin)"
            else:
                plats.append("Codex")
                alias = f"${name}"
            plats.extend(["OpenCode", "OMP", "Pi"])

            skills.append({
                "cmd": f"/{name}",
                "name": name,
                "alias": alias,
                "cat": "skill-global",
                "subcat": subcat,
                "platforms": plats,
                "badge": badge,
                "short": desc[:160] + ("..." if len(desc) > 160 else ""),
                "full": desc,
                "when": when
            })
    return skills

def build_dashboard(template_path=TEMPLATE_PATH, output_path=OUTPUT_PATH, src_skills_dir=SRC_SKILLS_DIR):
    with open(template_path, "r", encoding="utf-8") as f:
        html = f.read()

    # Extract original items from template first
    m_items_orig = re.search(r'const ALL_ITEMS = (\[[\s\S]*?\]);\s*(?:const|let|var|function)', html)
    if not m_items_orig:
        raise ValueError("const ALL_ITEMS not found in template")
    orig_items = json.loads(m_items_orig.group(1))

    sys_items = [it for it in orig_items if it.get("cat", "").startswith("sys-")]
    builtin_items = [it for it in orig_items if it.get("cat") == "skill-builtin"]
    extra_items = [it for it in orig_items if it.get("cat") == "skill-extra"]

    for it in sys_items:
        if it.get("cat") == "sys-agy":
            if it["cmd"] in GUI_NATIVE_COMMANDS:
                it["platforms"] = ["AGY GUI", "AGY CLI"]
                it["badge"] = "Native GUI & CLI Command"
            else:
                it["platforms"] = ["AGY CLI"]
                it["badge"] = "CLI Terminal Only"

    global_skills = scan_all_source_skills(src_skills_dir)
    new_all_items = sys_items + builtin_items + global_skills + extra_items

    sys_count = len(sys_items)
    global_count = len(global_skills)
    skill_count = len(builtin_items) + global_count + len(extra_items)
    total_count = len(new_all_items)

    # 1. Update all header labels and metrics dynamically
    html, n1 = re.subn(r'Kho Tra Cứu \(\d+\)', f'Kho Tra Cứu ({total_count})', html)
    html, n2 = re.subn(r'<div class="kpi-num">\d+ Mục</div>', f'<div class="kpi-num">{total_count} Mục</div>', html)
    html, n3 = re.subn(r'\d+ Lệnh Hệ thống \+ \d+ Kỹ năng(?: \([^)]*\))?', f'{sys_count} Lệnh Hệ thống + {skill_count} Kỹ năng (SSoT Đa Nền Tảng)', html)
    html, n4 = re.subn(r'placeholder="🔍 Gõ tìm trong \d+ kỹ năng', f'placeholder="🔍 Gõ tìm trong {skill_count} kỹ năng', html)
    html, n5 = re.subn(r'Tất cả \(\d+\)', f'Tất cả ({total_count})', html)
    html, n6 = re.subn(r'🌐 \d+ Global Skills \(9 Nền tảng\)', f'🌐 {global_count} Global Skills (9 Nền tảng)', html)
    html, n7 = re.subn(r'\d+ kỹ năng chung đồng bộ từ', f'{global_count} kỹ năng chung đồng bộ từ', html)
    html, n8 = re.subn(r'cho toàn bộ \d+ kỹ năng', f'cho toàn bộ {global_count} kỹ năng', html)
    html, n9 = re.subn(r'Luật & \d+ Kỹ năng', f'Luật & {global_count} Kỹ năng', html)
    html, n10 = re.subn(r'\d+ Global Skills \+ 36 Cyber/Attack Skills', f'{global_count} Global Skills', html)
    print(f"Header replacements: n1={n1}, n2={n2}, n3={n3}, n4={n4}, n5={n5}, n6={n6}, n7={n7}, n8={n8}, n9={n9}, n10={n10}")

    # 2. Search m_items on updated html so character offsets are exact
    m_items = re.search(r'const ALL_ITEMS = (\[[\s\S]*?\]);\s*(?:const|let|var|function)', html)
    if not m_items:
        raise ValueError("const ALL_ITEMS not found after header replacements")

    items_json_str = json.dumps(new_all_items, ensure_ascii=False)
    html = html[:m_items.start(1)] + items_json_str + html[m_items.end(1):]

    if "rel=\"icon\"" not in html:
        html = html.replace("<head>", '<head>\n  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>">')

    enhancement_script = """
    // === ENHANCEMENT: Platform Context & Builder Guard ===
    (function() {
      if (typeof PLAT_INFO !== 'undefined') {
        PLAT_INFO.agy_gui = {
          sysPrefix: '/',
          skillPrefix: '/',
          reload: '/skills',
          hint: 'Antigravity IDE (Chat GUI): Hỗ trợ 8 lệnh native slash commands (/plan, /boost, /goal, /teamwork, /grill-me, /browser, /compact, /learn).'
        };
        PLAT_INFO.agy_cli = {
          sysPrefix: '/',
          skillPrefix: '/',
          reload: '/skills reload',
          hint: 'Antigravity CLI (agy): Hỗ trợ đầy đủ cờ lệnh dòng lệnh và slash commands.'
        };
      }

      window.SYS_CMDS_BY_PLAT = {
        agy_gui: ['/plan', '/boost', '/goal', '/teamwork', '/grill-me', '/browser', '/compact', '/learn'],
        agy_cli: ['/goal', '/plan', '/boost', '/auto', '/compact', '/resume', '/rewind'],
        claude: ['/plan', '/compact', '/cost', '/review'],
        codex: ['/plan', '/review'],
        opencode: ['/plan'],
        omp: ['/plan', '/model', '/reload']
      };

      builderPlat = 'agy_gui';

      const platBox = document.getElementById('plat-pills-box');
      if (platBox) {
        platBox.innerHTML = `
          <button class="plat-pill active" data-plat="agy_gui" onclick="setBuilderPlat('agy_gui', this)">⚡ Antigravity IDE (GUI)</button>
          <button class="plat-pill" data-plat="agy_cli" onclick="setBuilderPlat('agy_cli', this)">💻 Antigravity CLI</button>
          <button class="plat-pill" data-plat="claude" onclick="setBuilderPlat('claude', this)">🟠 Claude Code</button>
          <button class="plat-pill" data-plat="codex" onclick="setBuilderPlat('codex', this)">🟢 OpenAI Codex CLI</button>
          <button class="plat-pill" data-plat="opencode" onclick="setBuilderPlat('opencode', this)">🟣 OpenCode</button>
          <button class="plat-pill" data-plat="omp" onclick="setBuilderPlat('omp', this)">🔷 OMP &amp; Pi</button>
        `;
      }

      window.renderSysCmdPills = function() {
        const container = document.getElementById('sys-cmd-pills');
        if (!container) return;
        const allowed = SYS_CMDS_BY_PLAT[builderPlat] || SYS_CMDS_BY_PLAT.agy_gui;
        container.innerHTML = allowed.map(cmd => {
          const it = ALL_ITEMS.find(x => x.cmd === cmd);
          const label = it ? `${cmd} (${it.short.split(':')[0].slice(0, 25)})` : cmd;
          const isSel = selectedSysCmds.includes(cmd);
          return `<button class="plat-pill ${isSel ? 'active' : ''}" data-cmd="${cmd}" onclick="toggleSysCmd('${cmd}', this)">${label}</button>`;
        }).join('');
      };

      window.setBuilderPlat = function(plat, btn) {
        builderPlat = plat;
        document.querySelectorAll('#plat-pills-box .plat-pill').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        const allowed = SYS_CMDS_BY_PLAT[builderPlat] || SYS_CMDS_BY_PLAT.agy_gui;
        selectedSysCmds = selectedSysCmds.filter(c => allowed.includes(c));
        renderSysCmdPills();
        if (typeof updateBuilder === 'function') updateBuilder();
      };

      // Wrap updateBuilder to sanitize selectedSysCmds every output
      const origUpdateBuilder = window.updateBuilder;
      window.updateBuilder = function() {
        const allowed = SYS_CMDS_BY_PLAT[builderPlat] || SYS_CMDS_BY_PLAT.agy_gui;
        selectedSysCmds = selectedSysCmds.filter(c => allowed.includes(c));
        if (origUpdateBuilder) {
          origUpdateBuilder();
        }
      };

      const origApplyPreset = window.applyPreset;
      window.applyPreset = function(sysCmds, skills, taskText) {
        const allowed = SYS_CMDS_BY_PLAT[builderPlat] || SYS_CMDS_BY_PLAT.agy_gui;
        const filteredSys = sysCmds.filter(c => allowed.includes(c));
        if (origApplyPreset) {
          origApplyPreset(filteredSys, skills, taskText);
        }
        renderSysCmdPills();
      };

      renderSysCmdPills();
    })();
    """

    close_script_idx = html.rfind("</script>")
    if close_script_idx == -1:
        raise ValueError("</script> not found in template")
    html = html[:close_script_idx] + enhancement_script + "\n    " + html[close_script_idx:]

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    with open(BRAIN_PATH, "w", encoding="utf-8") as f:
        f.write(html)

    return len(new_all_items)

if __name__ == "__main__":
    count = build_dashboard()
    print(f"Generated dashboard with {count} items.")
