# Live verification

| Item | Value |
| --- | --- |
| Network | GenLayer Studionet, chain ID 61999 |
| Contract | [0xfF414ff367F24a64B44593eF8a162a420894239b](https://explorer-studio.genlayer.com/address/0xfF414ff367F24a64B44593eF8a162a420894239b) |
| Deployment | [0x41007b361fd26e5d9acd8afe52661a94faf1532467bc4e4d60ee24c273b91d5a](https://explorer-studio.genlayer.com/tx/0x41007b361fd26e5d9acd8afe52661a94faf1532467bc4e4d60ee24c273b91d5a), finalized |
| Studio-imported source commit | `4bc46b365fb1a4a46e6535491c6067404a508871` |
| Audit | [Initial audit](https://explorer-studio.genlayer.com/tx/0x979a54fb5192994a95fe84be7ff41bee920d64bb65033c3543658a63e008ee68), finalized, execution success |
| Retry | [Second audit](https://explorer-studio.genlayer.com/tx/0x58634dae8955bd3e3cd07741ed8bd611303a9966afab1c0a06aec1335a47bf50), finalized, execution success |
| Review ID | `0d4f43c877037da41a83f86bf352cd3fff8394dda742ada792572d0427c939cb` |

Both transactions used Studio's built-in account in Normal (Full Consensus) mode. Studio showed pending, proposing, committing, revealing, accepted and finalized stages. The validator consensus output was `INCONCLUSIVE`, with `manifest_fingerprint: UNAVAILABLE`. The same commit-pinned GitHub manifest opened in the browser. This evidence confirms deployment, transaction finality, and the unavailable-evidence branch. It does not confirm successful GenVM retrieval.

Reproduce by opening [GenLayer Studio](https://studio.genlayer.com/run-debug), using the deployed contract, and calling `audit` with the manifest URL and SHA-256 in [the frontend config](../web/config.json). Read `get_report` for the review ID above with the state selector set to Finalized.

The three-way synthetic fixture is verified locally against the same contract review functions. Expected outcomes are `COMPLETE`, `MISSING_NOTICE`, and `CONFLICTING_LICENSE`. Run `npm test` for nine Python and three JavaScript checks. The Python suite stubs the SDK and fetches fixture bytes from disk. Studio accepted the contract schema and ran it through consensus. A separate GenVM lint binary was unavailable in the execution environment.
