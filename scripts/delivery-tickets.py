import argparse
import hashlib
import json
import re
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REPO = "hyetigran/read-at-three"
LABEL = "ready-for-agent"
MANIFEST = ROOT / "docs/github-issues.json"
PLAN = ROOT / "docs/delivery-plan.md"


def gh(*args):
    result = subprocess.run(
        ["gh", *args], capture_output=True, text=True, check=True
    )
    return result.stdout.strip()


def api(endpoint, *args):
    return json.loads(gh("api", endpoint, *args))


def load_plan():
    text = PLAN.read_text()
    shared = text.split("## Rules shared by the implementation tickets\n", 1)[1]
    shared = shared.split("\nTicket 01 is", 1)[0].strip()
    tickets = []
    for match in re.finditer(
        r"^## (\d{2}) — ([^\n]+)\n(.*?)(?=^## |\Z)", text, re.M | re.S
    ):
        plan_id, title, section = match.groups()
        blockers = section.split("**Blocked by:** ", 1)[1].split("\n", 1)[0]
        what = section.split("**What to build:** ", 1)[1]
        what, criteria = what.split("\n\n**Acceptance criteria:**\n", 1)
        tickets.append(
            {
                "planId": plan_id,
                "title": title,
                "blockers": re.findall(r"\b\d{2}\b", blockers),
                "what": what.strip(),
                "criteria": criteria.strip(),
                "shared": shared,
            }
        )
    assert len(tickets) == 34, "Expected 34 approved slices"
    seen = set()
    for ticket in tickets:
        assert ticket["planId"] not in seen
        assert set(ticket["blockers"]) <= seen, "Blockers must precede dependents"
        assert "- [ ] " in ticket["criteria"]
        seen.add(ticket["planId"])
    assert sum(len(t["blockers"]) for t in tickets) == 48
    return tickets


def issue_body(ticket, records):
    blockers = "\n".join(
        f"- #{records[blocker]['number']}" for blocker in ticket["blockers"]
    ) or "- None — can start immediately."
    return (
        f"<!-- delivery-plan:{ticket['planId']} -->\n\n"
        f"## What to build\n\n{ticket['what']}\n\n"
        f"## Acceptance criteria\n\n{ticket['criteria']}\n\n"
        f"## Blocked by\n\n{blockers}\n\n"
        f"## Shared implementation requirements\n\n{ticket['shared']}"
    )


def remote_issues():
    pages = json.loads(
        gh(
            "api", "--paginate", "--slurp",
            f"repos/{REPO}/issues?state=all&per_page=100",
        )
    )
    return [issue for page in pages for issue in page if "pull_request" not in issue]


def save(manifest):
    temporary = MANIFEST.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    temporary.replace(MANIFEST)


def main():
    parser = argparse.ArgumentParser(description="Publish or verify the approved delivery plan")
    parser.add_argument("--publish", action="store_true")
    args = parser.parse_args()
    tickets = load_plan()
    existing = remote_issues()
    by_marker = {}
    for issue in existing:
        marker = re.search(r"<!-- delivery-plan:(\d{2}) -->", issue.get("body") or "")
        if marker:
            key = marker.group(1)
            assert key not in by_marker, f"Duplicate plan marker {key}"
            by_marker[key] = issue
    assert set(by_marker) <= {t["planId"] for t in tickets}
    if args.publish:
        labels = json.loads(gh("label", "list", "--repo", REPO, "--limit", "100", "--json", "name"))
        if LABEL not in {label["name"] for label in labels}:
            gh("label", "create", LABEL, "--repo", REPO, "--color", "7057ff",
               "--description", "Agent-sized delivery slice; blockers determine when work can start")
            time.sleep(1.2)
    manifest = {"repository": REPO, "label": LABEL, "status": "publishing", "issues": []}
    records = {}
    for ticket in tickets:
        key = ticket["planId"]
        body = issue_body(ticket, records)
        assert "/Users/" not in body and "```" not in body
        issue = by_marker.get(key)
        if issue is None:
            assert args.publish, f"Plan {key} is not published"
            assert not any(i["title"] == ticket["title"] for i in existing), "Unmarked matching issue requires inspection"
            result = json.loads(
                subprocess.run(
                    ["gh", "api", f"repos/{REPO}/issues", "--method", "POST", "--input", "-"],
                    input=json.dumps({"title": ticket["title"], "body": body, "labels": [LABEL]}),
                    capture_output=True, text=True, check=True,
                ).stdout
            )
            issue = result
            time.sleep(1.2)
        assert issue["title"] == ticket["title"], f"Title mismatch {key}"
        assert (issue.get("body") or "").strip() == body, f"Body mismatch {key}"
        assert LABEL in {label["name"] for label in issue["labels"]}
        record = {
            "planId": key, "number": issue["number"], "databaseId": issue["id"],
            "url": issue["html_url"], "title": issue["title"],
            "blockedBy": [records[b]["number"] for b in ticket["blockers"]],
            "bodySha256": hashlib.sha256(body.encode()).hexdigest(),
        }
        records[key] = record
        manifest["issues"].append(record)
        if args.publish:
            save(manifest)
        endpoint = f"repos/{REPO}/issues/{issue['number']}/dependencies/blocked_by"
        actual = api(endpoint, "--method", "GET", "-f", "per_page=100")
        actual_ids = {item["id"] for item in actual}
        expected_ids = {records[b]["databaseId"] for b in ticket["blockers"]}
        assert actual_ids <= expected_ids, f"Unexpected blocker on {key}"
        if args.publish:
            for blocker in ticket["blockers"]:
                if records[blocker]["databaseId"] not in actual_ids:
                    api(endpoint, "--method", "POST", "-F", f"issue_id={records[blocker]['databaseId']}")
                    time.sleep(1.2)
            actual = api(endpoint, "--method", "GET", "-f", "per_page=100")
        assert {item["id"] for item in actual} == expected_ids, f"Native dependency mismatch {key}"
        print(f"Verified plan {key}: {record['url']} ({len(expected_ids)} blockers)", flush=True)
    final = remote_issues()
    published = [i for i in final if re.search(r"<!-- delivery-plan:\d{2} -->", i.get("body") or "")]
    assert len(published) == len(tickets), "Final published count mismatch"
    for issue in published:
        key = re.search(r"<!-- delivery-plan:(\d{2}) -->", issue["body"]).group(1)
        assert issue["title"] == records[key]["title"]
        assert hashlib.sha256(issue["body"].strip().encode()).hexdigest() == records[key]["bodySha256"]
        assert LABEL in {label["name"] for label in issue["labels"]}
    manifest["status"] = "verified"
    manifest["verifiedAt"] = datetime.now(timezone.utc).isoformat()
    manifest["nativeDependencyCount"] = 48
    save(manifest)
    print("Verified 34 GitHub issues, labels, exact bodies and 48 native blocking relationships.", flush=True)


if __name__ == "__main__":
    main()
