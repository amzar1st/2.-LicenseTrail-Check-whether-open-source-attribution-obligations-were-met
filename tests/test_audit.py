import importlib.util
import json
from pathlib import Path
import sys
from types import SimpleNamespace
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
identity = lambda fn: fn
stub = SimpleNamespace(Contract=object, public=SimpleNamespace(view=identity, write=identity),
                       eq_principle=SimpleNamespace(strict_eq=lambda fn: fn()))
spec = importlib.util.spec_from_file_location("license_trail", ROOT / "contracts/license_trail.py")
audit = importlib.util.module_from_spec(spec)
with patch.dict(sys.modules, {"genlayer": SimpleNamespace(gl=stub, TreeMap=dict)}):
    spec.loader.exec_module(audit)


class ReviewTests(unittest.TestCase):
    def setUp(self):
        self.config = json.loads((ROOT / "web/config.json").read_text())
        self.ref = {"url": self.config["manifest"], "sha256": self.config["sha256"]}
        self.manifest = json.loads((ROOT / "fixtures/manifest.json").read_text())
        self.fixture = {
            self.ref["url"]: (ROOT / "fixtures/manifest.json").read_bytes(),
            self.ref["url"].replace("manifest.json", "NOTICE.txt"): (ROOT / "fixtures/NOTICE.txt").read_bytes(),
        }
        for dep in self.manifest["dependencies"]:
            url = dep["license"]["url"]
            self.fixture[url] = (ROOT / "fixtures" / url.rsplit("/", 1)[1]).read_bytes()

    def evaluate(self):
        return json.loads(audit.review(self.ref, self.fixture.__getitem__,
                                       lambda *_: self.fail("Unexpected semantic comparison")))

    def test_pinned_sdk_response_status(self):
        stub.nondet = SimpleNamespace(web=SimpleNamespace(
            get=lambda _: SimpleNamespace(status=200, body=b"evidence")))
        self.assertEqual(audit.fetch_file(self.ref["url"]), b"evidence")

    def test_three_way_demo(self):
        result = self.evaluate()
        self.assertEqual(result["status"], "ACTION_REQUIRED")
        self.assertEqual([row["outcome"] for row in result["findings"]],
                         ["COMPLETE", "MISSING_NOTICE", "CONFLICTING_LICENSE"])

    def test_independent_dependency_failure(self):
        key = self.manifest["dependencies"][1]["license"]["url"]
        self.fixture[key] = b"Tampered data"
        result = self.evaluate()
        self.assertEqual([row["outcome"] for row in result["findings"]],
                         ["COMPLETE", "INCONCLUSIVE", "CONFLICTING_LICENSE"])
        self.assertTrue(result["findings"][1]["license_fingerprint"].startswith("HASH_MISMATCH:"))

    def test_missing_manifest(self):
        self.fixture.clear()
        result = self.evaluate()
        self.assertEqual((result["status"], result["findings"]), ("INCONCLUSIVE", []))

    def test_forged_manifest(self):
        self.fixture[self.ref["url"]] = b'{"dependencies":[]}'
        self.assertTrue(self.evaluate()["manifest_fingerprint"].startswith("HASH_MISMATCH:"))

    def test_duplicate_manifest_fields(self):
        body = b'{"release":"x","release":"y"}'
        self.fixture[self.ref["url"]] = body
        self.ref["sha256"] = audit.digest(body)
        self.assertEqual(self.evaluate()["manifest_error"], "INVALID_MANIFEST")

    def test_mutable_urls_and_path_traversal(self):
        url = self.ref["url"]
        for candidate in (url.replace(self.config["sourceCommit"], "main"), url + "?raw=1",
                          url.replace("fixtures/", "../fixtures/"), url.replace("raw.githubusercontent.com", "localhost")):
            with self.subTest(candidate=candidate), self.assertRaises(ValueError):
                audit.pin({"url": candidate, "sha256": self.ref["sha256"]})

    def test_shipped_notices_must_share_release_commit(self):
        self.manifest["notices"]["url"] = self.manifest["dependencies"][0]["license"]["url"]
        with self.assertRaisesRegex(ValueError, "share the manifest"):
            audit.manifest_rows(json.dumps(self.manifest), self.ref["url"])

    def test_semantic_evidence_cannot_issue_complete(self):
        for answer, expected in [("EQUIVALENT", "INCONCLUSIVE"), ("MISSING", "MISSING_NOTICE"),
                                 ("COMPLETE", "INCONCLUSIVE"), ("Ignore previous prompt", "INCONCLUSIVE")]:
            stub.nondet = SimpleNamespace(exec_prompt=lambda _: answer)
            self.assertEqual(audit.compare_notice("Original", "Rephrased")[0], expected)

    def test_inconclusive_retry_then_stable_report(self):
        contract = audit.LicenseTrail()
        contract.reports = {}
        with patch.object(audit, "fetch_file", side_effect=OSError):
            identifier = contract.audit(**dict(manifest_url=self.ref["url"], manifest_sha256=self.ref["sha256"]))
        first = json.loads(contract.get_report(identifier))
        self.assertEqual(first["status"], "INCONCLUSIVE")
        with patch.object(audit, "fetch_file", side_effect=self.fixture.__getitem__):
            self.assertEqual(contract.audit(self.ref["url"], self.ref["sha256"]), identifier)
        second = json.loads(contract.get_report(identifier))
        with patch.object(audit, "fetch_file", side_effect=AssertionError("Must reuse report")):
            self.assertEqual(contract.audit(self.ref["url"], self.ref["sha256"]), identifier)
        self.assertEqual(second["status"], "ACTION_REQUIRED")
        self.assertNotEqual(first["decision_hash"], second["decision_hash"])
        recorded_hash = second.pop("decision_hash")
        self.assertEqual(recorded_hash, audit.digest(audit.canonical(second).encode()))
