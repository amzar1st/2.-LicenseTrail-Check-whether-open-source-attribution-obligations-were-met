# LicenseTrail

Verify the attribution evidence declared for a specific software release. GenLayer validators independently fetch a commit-pinned release manifest and its SHA-256-bound notice and dependency files, then agree on a canonical per-dependency report.

LicenseTrail reports on the submitted evidence and review policy. It cannot attest to dependency discovery, artifact contents outside the evidence, or legal compliance.

## Review a release

1. Commit the shipped notices and a manifest following [the fixture schema](fixtures/manifest.json). Use raw GitHub URLs containing full commit IDs for upstream evidence. The shipped notice can use a path relative to the root of the manifest's commit.
2. Compute the manifest's SHA-256 from the exact raw bytes. In Studio Run and Debug, use the built-in account to call `audit(manifest_url, manifest_sha256)` in Normal (Full Consensus) mode.
3. Open the dashboard, enter the same evidence coordinates, and read the finalized report. Paste the transaction hash to track status separately from execution. A successful transaction can record an inconclusive result.
4. See [live verification](docs/LIVE_VERIFICATION.md) for the deployed address, transactions, and current demo results.

## Policy

The policy supports single-license MIT, BSD-2-Clause, BSD-3-Clause, and Apache-2.0 evidence. It checks recognizable license text and requires the full pinned license text, after whitespace normalization, in the committed shipped notices. It checks any supplied upstream NOTICE from the same commit as the corresponding license file. For reworded upstream notices, validators compare the texts independently and agree on the categorical result. Reworded attribution requires manual review before the contract can give a complete finding. Invalid or unavailable evidence is recorded per dependency where possible.

Each review key commits to the policy and manifest coordinates. The decision hash commits to the report and its review key. Non-inconclusive reports are immutable for those coordinates. Inconclusive reports can be retried without changing the evidence commitments.

## Development

Use Node.js 22+ and Python 3.11+.

```sh
npm ci
npm test
npm run build
```

The frontend is emitted to `dist/`. Configure the Studionet address and fixture in `web/config.json`. The frontend uses the GenLayer JS SDK for finalized reads and transaction tracking. The Studio account signs writes inside Studio, so the dashboard does not handle wallet keys or require a browser extension.

See [security and scope](docs/SECURITY.md) for the trust model.
