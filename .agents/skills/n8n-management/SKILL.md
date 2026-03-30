---
name: n8n-management
description: Rules and procedures for managing n8n workflows. Prevents duplicates, ensures check-then-update logic, and mandates testing after edits.
---

# n8n Management Skill

This skill ensures efficient and clean management of n8n workflows, avoiding redundancy and ensuring reliability.

## 📋 Core Principles

1. **Check Before Action**: Never create a workflow without first checking if a similar one (by name or purpose) already exists.
2. **Edit Over Create**: If a workflow exists, prioritize `update_n8n_workflow` over creating a new one.
3. **No Duplicates**: Treat duplicate workflows as technical debt. If you find duplicates, merge them and delete the redundant ones.
4. **Test → Tweak → Verify**: Every edit MUST be followed by a test. If the test fails, analyze the error, tweak the JSON, and re-verify.
5. **Header Dependency**: n8n workflows for this project strictly rely on row 1 headers (`Label`, `Value`, etc.) in Google Sheets. Always ensure these exist before running n8n-integrated tools.

## 🛠️ Operational Workflow

### 1. Discovery Phase
- Use `list_n8n_workflows` to get all current workflows.
- Search for names that match the target feature (e.g., "Menu API", "New Order").

### 2. Decision Logic
- **If FOUND**:
    - Fetch details with `get_n8n_workflow(id)`.
    - Map out the required changes to the nodes/connections only.
    - Call `update_n8n_workflow(id, workflowData)`.
- **If NOT FOUND**:
    - Call `create_n8n_workflow(...)`.

### 3. Verification Phase
- Trigger the workflow (via its webhook URL or n8n test execution).
- Check the output/logs using the execution history API:
  `GET /api/v1/executions?workflowId={id}&limit=5`
- **If FAIL**: Fetch the latest JSON, apply fixes, repeat.
- **If SUCCESS**: Report completion.

## ⚠️ Important Constraints
- **N8N_HOST** and **N8N_TOKEN** are required (should be in `.env` or MCP config).
- Always use the `kitchen-mcp` tools when interacting with n8n.
- When updating, preserve existing node IDs to maintain connections unless a full rewrite is required.

---

## 🔴 CRITICAL: n8n Node Facts (Verified on v1.121.3)

### Google Sheets Node (typeVersion 4)

| UI Label | Internal `operation` value | Notes |
|---|---|---|
| **Get Rows** | `getAll` (set by default — no need to specify) | UI renamed it; API value unchanged |
| Append Row | `append` | |
| Update Row | `update` | |

**Sheet reference format** — MUST use the numeric GID, not the name string:
```json
"sheetName": {
  "__rl": true,
  "value": 388834383,
  "mode": "list",
  "cachedResultName": "Settings",
  "cachedResultUrl": "https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid=388834383"
}
```
> Known sheet GIDs for this project:
> - `Settings` → `388834383`
> - `Menu` → `1187081843`
> - `Orders` → (check the sheet URL)
> - `Discounts` → (check the sheet URL)

**Credential binding** — credentials set via the n8n UI have encrypted internal data. **NEVER try to create a new Google Sheets node with credentials via API** — the credential binding will appear valid but cannot execute. Only update Code nodes and logic nodes via API. If Google Sheets credentials need to change, do it in the n8n UI.

### Code Node (typeVersion 2, executionOrder: "v0")

On this n8n instance (`executionOrder: "v0"`), use the **legacy `$items()` syntax**:
```js
// ✅ CORRECT for executionOrder: "v0"
const settingsData = $items("Get Settings");
const menuData = $items("Get Menu");

// ❌ WRONG — only works in executionOrder: "v1"
const settingsData = $('Get Settings').all();
const menuData = $input.all();
```

The return format for typeVersion 2 Code node in v0 mode:
```js
// Return a plain object — n8n wraps it automatically
return { store, branding, menu };

// NOT an array — that's v1 syntax
// return [{ json: { store, branding, menu } }];  ← WRONG for v0
```

### Workflow Activation/Deactivation (v1.121.3)

This server uses **POST**, not PUT:
```
POST /api/v1/workflows/{id}/activate
POST /api/v1/workflows/{id}/deactivate
```
> The newer docs say `PUT` but this version uses `POST`. Always verify against the running version.

### Execution Status Debugging
```
GET /api/v1/executions?workflowId={id}&limit=5
GET /api/v1/executions/{executionId}
```
- `status: "error"` + `finished: false` = workflow crashed before `Respond to Webhook` node ran → client gets empty body.
- `status: "success"` + `finished: true` = check `Respond to Webhook` output.
