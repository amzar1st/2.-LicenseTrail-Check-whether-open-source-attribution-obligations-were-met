# Security and scope

- Evidence is fetched inside GenLayer's equivalence block. The leader and validators independently retrieve inputs and agree on a canonical report containing outcome codes and verified fingerprints. Free-form model output never enters state.
- The contract accepts exact HTTPS raw GitHub paths pinned to 40-character commits. It rejects mutable refs, arbitrary hosts, query strings, traversal, and invalid hashes. SHA-256 is mandatory, including for the manifest and notices. The audit bounds manifests to five dependencies and evidence used by the contract to 10,000 bytes per file. The network API receives the response before the contract checks its size.
- Full normalized text must match for a complete result. Upstream semantic comparison runs only after the pinned license text matched. The model can flag an omission or request manual review. Evidence strings are untrusted, and a semantic response cannot cause a complete finding.
- A digest proves byte identity. The submitter remains responsible for the completeness of the manifest, the upstream provenance, whether an upstream NOTICE is required, and whether the pinned shipped notice actually appears in the distributed artifact. The contract does not inspect release binaries or enumerate dependencies.
- License recognition uses bounded text signatures and supports a conservative subset of single-license notices. Dual licenses, SPDX expressions, and other obligations require separate review.
- Finalized on-chain results depend on the availability of Studionet and GenVM's external web retrieval.
