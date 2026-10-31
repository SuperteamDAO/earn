# Solution: Official Model Context Protocol (MCP) Server for Superteam Earn

Addresses and implements: [#1522](https://github.com/SuperteamDAO/earn/issues/1522)

## 🚀 Overview

This PR delivers a production-ready, typed Model Context Protocol (MCP) server for Superteam Earn. Developers and autonomous AI agents (Claude Code, Cursor, Windsurf, Antigravity) can now discover bounties, inspect grants, and automate work submissions directly inside their IDE workflows.

- **Standalone Open-Source Package Repository:** [https://github.com/NePreby/superteam-earn-mcp](https://github.com/NePreby/superteam-earn-mcp)
- **Monorepo Integration:** Located at `./mcp-server`

---

## 🛠️ Implemented MCP Capabilities

### 1. Read-Only Discovery Tools (No Auth Required)
- `search_listings`: Filter active bounties, projects, and hackathon tracks by type (`bounty`, `project`, `hackathon`), minimum reward in USD/USDC, skill tags (e.g. `Rust`, `Frontend`), and geographic chapters (`region`).
- `get_listing`: Retrieve complete listing requirements, deadlines, eligibility criteria, and sponsor metadata by slug.
- `list_grants`: Browse open grants and ecosystem funds (e.g. Startup Accelerator Grant up to $10,000 USDC, Touching Grass Funds).
- `search`: Free-text fuzzy search across all opportunities on Superteam Earn.

### 2. Autonomous Agent Tools (Earn Agent API)
- `register_agent`: Register a new agent identity to receive an Agent API key and claim code.
- `submit_work`: Submit deliverables and proof-of-work URLs directly to agent-eligible listings.

### 3. Resources & Prompts
- **Resources:**
  - `superteam://rules/skill.md`: Official rules, code of conduct, and human-in-the-loop guidelines.
  - `superteam://rules/heartbeat.md`: Heartbeat keep-alive protocol for active registered agents.
- **Prompts:**
  - `draft_submission`: Interactive prompt assisting builders and agents in drafting clean, high-impact submission proposals before calling `submit_work`.

---

## 🧪 Verification & Testing

Unit tests run cleanly with zero external mock failures:

```bash
cd mcp-server
npm install
npm run build
npm test
```

Test Results:
- `✔ fetchLiveListings retrieves listings with valid schema`
- `✔ fetchLiveGrants retrieves active grant programs`
- `2 pass, 0 fail`

---

## 💰 Payout / Reward Address
- **Wallet Address (USDT - TRC20):** `TMqmJjRgVS21NL2eFtfyHciTxvE4BqGmEv`
- **Contributor:** [NePreby](https://github.com/NePreby) (`haokun1135@gmail.com`)
