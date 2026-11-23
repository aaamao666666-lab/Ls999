# Reusable Open-Source Toolbox

This folder is the persistent index for tools used across projects and future tasks. It is deliberately separate from the LS99 website runtime.

## How future tasks should use it

1. Match the task to a tool below.
2. Check the current upstream README and LICENSE before installation or commercial use.
3. Use the connected GitHub / Adobe / fal tools where available.
4. For tools that need a server, GPU, secrets, or user authorization, deploy a controlled API/MCP adapter; do not pretend a source archive alone makes it callable from ChatGPT.
5. Keep credentials out of this repository.

## Initial verified shortlist

| Task | Upstream | Code license / caution | Notes |
|---|---|---|---|
| Talking portrait / facial motion | https://github.com/KwaiVGI/LivePortrait | MIT code; InsightFace model assets have separate non-commercial terms unless replaced | Good candidate for the digital-human pipeline. |
| Photo + audio talking head | https://github.com/OpenTalker/SadTalker | Apache-2.0 code; inspect third-party model/assets separately | Research / prototype candidate; check runtime compatibility. |
| Face processing | https://github.com/facefusion/facefusion | OpenRAIL-AS; model assets have individual terms, some non-commercial | Not marked commercial-ready by default. Use only authorized portraits. |
| Website screenshot to code | https://github.com/abi/screenshot-to-code | Verify current upstream license and model/API costs before use | Useful for UI reconstruction; not a one-click production clone. |
| WebRTC softphone building block | https://github.com/versatica/JsSIP | MIT | Browser SIP client library; requires SIP server/account. |
| Self-hosted deployment | https://github.com/coollabsio/coolify | Apache-2.0 (verify current upstream license on install) | Server deployment panel; requires a VPS. |
| Game framework | https://github.com/phaserjs/phaser | MIT | 2D browser game framework; not a gambling backend. |
| PBX / telephony server | https://github.com/asterisk/asterisk | GPL-2.0 | Full PBX; requires server administration and telecom configuration. |

## Important boundaries

- "Open source" does not mean all model weights, datasets, media, or third-party assets are commercially licensed.
- No user portraits/videos should be processed without the subject's permission.
- This catalog is not an installed runtime and does not itself create ChatGPT-wide tool access.
- ChatGPT cross-conversation invocation requires a connected app/custom MCP/API service with explicit authorization.
- Gambling-related entries, if ever added, are restricted to non-monetary demo/simulation use; no real-money wagering or payment integration.

## Download status

The repository links above are source references, not local downloads. Use the `Download source pack` GitHub Actions workflow to create a ZIP artifact. The artifact is only available after the workflow completes successfully.
