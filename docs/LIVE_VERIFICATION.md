# Live verification

Open [LicenseTrail](https://licensetrail.tinymule33.chatgpt.site/) and select **Load live demo**. The dashboard reads the finalized report directly from Studionet. Select **Track transaction** to inspect the demo receipt.

| Item | Verified value |
| --- | --- |
| Network | GenLayer Studionet, chain ID 61999 |
| Contract | [0xfF414ff367F24a64B44593eF8a162a420894239b](https://explorer-studio.genlayer.com/address/0xfF414ff367F24a64B44593eF8a162a420894239b) |
| Initial deployment | [Finalized receipt](https://explorer-studio.genlayer.com/tx/0x41007b361fd26e5d9acd8afe52661a94faf1532467bc4e4d60ee24c273b91d5a) |
| Current code upgrade | [Finalized receipt](https://explorer-studio.genlayer.com/tx/0x11a69516fae2af90a5d0d84dae9733424c33178da07bff1524af3629db86b00f) |
| Current contract source | [Source at commit 0d966d1](https://github.com/amzar1st/2.-LicenseTrail-Check-whether-open-source-attribution-obligations-were-met/blob/0d966d17260414a636262ec2944dccb1e49a0a70/contracts/license_trail.py) |
| Three-dependency audit | [Finalized successful receipt](https://explorer-studio.genlayer.com/tx/0x58a47cf6597c02808e26122ef0d382e23168ab115c0b7a6053a9f5c6912867a8) |
| Invalid digest | [Finalized failed execution](https://explorer-studio.genlayer.com/tx/0xbff4d68805bf52dac3ff6b60f710c12420c0840c96ce88ff3cce05bb63967499) |
| Review ID | `0d4f43c877037da41a83f86bf352cd3fff8394dda742ada792572d0427c939cb` |
| Decision SHA-256 | `1652ba04b59dae9c947b6dad6cc73aac9b78b46a6b20b2644a8f45d34c507223` |

## Observed report

| Dependency | Result |
| --- | --- |
| `demo-complete@1.0.0` | `COMPLETE` |
| `demo-missing@1.0.0` | `MISSING_NOTICE` |
| `demo-conflict@1.0.0` | `CONFLICTING_LICENSE` |

The release result is `ACTION_REQUIRED`. The dashboard lists the exact pinned manifest, shipped notice, and upstream license files. The fixture uses synthetic dependency names and authors.

## Reproduce

1. [Import the deployed contract into Studio](https://studio.genlayer.com/?import-contract=0xfF414ff367F24a64B44593eF8a162a420894239b), then open **Run and Debug**. The built-in Studio account signs transactions. Select **Normal (Full Consensus)**.
2. Call `audit` with the manifest URL and SHA-256 in [frontend configuration](../web/config.json). Wait for finalization and inspect execution separately from consensus status.
3. Open `get_report` with the review ID above and select **Finalized**. A replay with the same manifest and digest returns the existing review ID. For a failure-path example, load the invalid-digest transaction from the table in the dashboard tracker.
4. Run `npm ci`, `npm test` and `npm run build`. The test suite covers ten Python and three JavaScript checks. GenVM lint and schema validation passed for the upgraded source.

The [initial audit](https://explorer-studio.genlayer.com/tx/0x979a54fb5192994a95fe84be7ff41bee920d64bb65033c3543658a63e008ee68) and its [retry](https://explorer-studio.genlayer.com/tx/0x58634dae8955bd3e3cd07741ed8bd611303a9966afab1c0a06aec1335a47bf50) recorded `INCONCLUSIVE` because the original source used the wrong HTTP status field for the pinned SDK. The Studio code upgrade retained the address, and the corrected audit replaced the inconclusive record at the same review ID.
