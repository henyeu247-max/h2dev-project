"""Read-only checks for the learning review; never executes source scripts."""
import ast
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = ROOT / '_audit/20260906-learning-corpus'

def main():
    inv = json.loads((BASE / 'document-inventory.json').read_text(encoding='utf-8'))
    p = pathlib.Path(inv[783]['paths'][0])
    try:
        ast.parse(p.read_text(encoding='utf-8-sig'))
        syntax = {'file': p.name, 'valid': True}
    except SyntaxError as err:
        syntax = {'file': p.name, 'valid': False, 'line': err.lineno, 'error': err.msg}
    report = ROOT / 'docs/NOI-BO/bao-cao/bao-cao-tong-hop-hoc-lieu-va-chuan-san-xuat-20260908.md'
    links = []
    if report.exists():
        for target in re.findall(r'\]\(([^)]+)\)', report.read_text(encoding='utf-8')):
            if not target.startswith(('https://', 'http://', '#')):
                links.append({'target': target, 'exists': (report.parent / target).resolve().exists()})
    docs = json.loads((ROOT / 'data-tabs/tai-lieu-full.json').read_text(encoding='utf-8'))
    cards = [x for x in docs if x.get('file') == str(report.relative_to(ROOT)).replace('\\', '/')]
    print(json.dumps({'source_syntax': syntax, 'report_exists': report.exists(),
                      'report_links': links, 'report_cards': len(cards),
                      'document_cards_total': len(docs)}, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
