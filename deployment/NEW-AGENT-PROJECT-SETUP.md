# New web app for another Foundry agent (same Foundry resource)

How to create a second, independent copy of this web app that chats with a **different agent** in the **same Foundry resource** (`adhinan-0796-resource`). Each copy talks to exactly one agent, so you get one folder per agent.

Two paths, depending on how far you need to go:

- **Part A: local only.** Run the new app on your machine. About 15 minutes, no Azure deployment.
- **Part B: deploy to Azure.** Add this on top of Part A when the new app needs its own URL.

---

## 0. What is shared and what is new

| Item | Shared with the Finance app | New for the new app |
|---|---|---|
| Foundry resource `adhinan-0796-resource` (RG `rg-adhinan-0048`) | ✅ | |
| Foundry project `adhinan-0796` (or a new project in the same resource, see 1.2) | ✅ usually | optional |
| Your developer access to Foundry (Azure CLI login and role) | ✅ | |
| Foundry agent | | ✅ |
| Source folder / git repo | | ✅ |
| `backend/WebApp.Api/.env`, `frontend/.env.local` | | ✅ |
| Entra app registration (sign-in) | ✅ can reuse locally | ✅ always new when deploying with azd |
| Local ports (8080 / 5173) | | ✅ only if both apps run at the same time |
| Azure resource group, container registry, container app, managed identity | | ✅ created by `azd up` |

Changing which agent an existing app talks to needs no code changes. The backend reads only these settings:

| Variable | Meaning |
|---|---|
| `AI_AGENT_ENDPOINT` | Foundry **project** endpoint: `https://adhinan-0796-resource.services.ai.azure.com/api/projects/<project>` |
| `AI_AGENT_ID` | Agent **name** as shown in Foundry, e.g. `RAK-TA-HR-Agent`. Not a GUID. |
| `AI_AGENT_VERSION` | Optional version number. If unset, the newest version is used. |

---

## 1. Create the new agent in Foundry

### 1.1 Agent in the existing project (recommended)

1. Open https://ai.azure.com and select the project **adhinan-0796**.
2. Go to **Agents → + New agent**.
3. Pick a model deployment. Use an existing one or deploy a new model under **Models + endpoints**.
4. Give it a clear name, e.g. `RAK-TA-HR-Agent`. **This name becomes `AI_AGENT_ID`.** Avoid spaces.
5. Add instructions, knowledge (file search, AI Search) and tools (MCP, OpenAPI, code interpreter) as needed.
6. Save. This creates version 1.
7. Test the agent in the Foundry playground before wiring the web app.

Check from the existing repo (lists name, ID and model of every agent in the project):

```powershell
.\deployment\scripts\list-agents.ps1 -ProjectEndpoint https://adhinan-0796-resource.services.ai.azure.com/api/projects/adhinan-0796
```

Use the value in the **Name** column.

### 1.2 Agent in a new project inside the same resource (optional)

Only do this if you want the agents isolated, with separate files, connections and conversations.

1. In ai.azure.com, open the resource **adhinan-0796-resource**, then **+ New project**.
2. Create the agent inside it as in 1.1.
3. Your endpoint becomes `https://adhinan-0796-resource.services.ai.azure.com/api/projects/<new-project-name>`.
4. Make sure your developer account has **Azure AI User** on the resource or on the new project. Resource-level roles also cover new projects.

> Tools that call other systems (Dynamics, MCP servers, APIs) are authorized **inside the agent's connections**, not by this web app. Configure and test them in Foundry.

---

## Part A: run the new app locally

## 2. Create the new source folder

### Option 1: fresh clone (cleanest)

```powershell
cd "D:\TSC\Client\RAK_TA\fin agent code"
git clone <repo-url> RAKTA-HR-foundry-agent-webapp
```

`.env`, `.env.local` and `.azure/` are git-ignored, so a clone starts with no config. That's what you want.

### Option 2: copy the folder

Copy `RAKTA-FIN-foundry-agent-webapp` to a new folder, then **delete these** in the copy:

| Delete | Why |
|---|---|
| `.env` (repo root) | Holds the Finance agent's `AZURE_EXISTING_*` values. The `azd` pre-provision hook reads it, and its `"undefined"` values would be copied into the new app's config. |
| `.azure/` (if present) | Belongs to another azd environment |
| `backend/WebApp.Api/bin`, `backend/WebApp.Api/obj`, `frontend/node_modules`, `frontend/dist` | Build output; regenerated |
| `.git/` (only if the new app gets its own repo) | Then run `git init` and add a new remote |

Keep `backend/WebApp.Api/.env` and `frontend/.env.local` for now; step 4 edits them.

## 3. Name the app (optional branding)

| File | Change |
|---|---|
| `AI_AGENT_DISPLAY_NAME` in `backend/WebApp.Api/.env` | Friendly name in the header, placeholder and tab title (see step 4) |
| [azure.yaml](../azure.yaml) | `name: ai-foundry-agent`, only cosmetic for azd |

The RAKTA logo, colours and favicon are shared by every copy. The agent description and starter prompts come from the Foundry agent itself (`/api/agent`), so they update automatically. Set them in Foundry (agent **Description**, and **Starter prompts** under Configuration).

## 4. Configure sign-in and the agent

Pick **one** sign-in option.

### Option A: reuse the Finance app's Entra registration (fastest, local only)

Both apps can share one app registration for local sign-in. Only the agent lines change.

`backend/WebApp.Api/.env` (in the **new** folder):

```dotenv
# Local dev config - Do not commit
AzureAd__Instance=https://login.microsoftonline.com/
AzureAd__TenantId=ce5c9e34-9906-4081-8a98-69ec394244f1
AzureAd__ClientId=bd13e90e-2769-450c-9bac-0b90f4327a30
AzureAd__Audience=api://bd13e90e-2769-450c-9bac-0b90f4327a30
AI_AGENT_ENDPOINT=https://adhinan-0796-resource.services.ai.azure.com/api/projects/adhinan-0796
AI_AGENT_ID=<New-Agent-Name>
# AI_AGENT_VERSION=1
AI_AGENT_DISPLAY_NAME=<Friendly name, e.g. HR Assistant>
ENTRA_SCOPE_NAME=SopeAdhinan
```

`AI_AGENT_DISPLAY_NAME` is optional. It's the name shown in the RAKTA header, the input placeholder and the browser tab. Without it, the Foundry agent name is shown. For Azure deployments, also run `azd env set AI_AGENT_DISPLAY_NAME "<name>"`.

`frontend/.env.local`: unchanged.

```dotenv
VITE_ENTRA_SPA_CLIENT_ID=bd13e90e-2769-450c-9bac-0b90f4327a30
VITE_ENTRA_TENANT_ID=ce5c9e34-9906-4081-8a98-69ec394244f1
VITE_ENTRA_SCOPE_NAME=SopeAdhinan
```

Rules for these files:
- No quotes around values. The backend's `.env` loader does not strip them.
- `AI_AGENT_ID` must be the agent's **name**, not its GUID.
- `ENTRA_SCOPE_NAME` (backend) and `VITE_ENTRA_SCOPE_NAME` (frontend) must match the scope exposed on the app registration. If both are omitted, they default to `Chat.ReadWrite`.

### Option B: a separate Entra registration for the new app

Use this if the new app needs its own users, consent or sign-in branding. Follow [NEW-APP-AUTH-SETUP.md](NEW-APP-AUTH-SETUP.md) with new names (e.g. `RAKTA-HR-Web-Dev` / `RAKTA-HR-API-Dev`). Then set the same agent lines as in Option A.

### Option C: let azd create it

If you go on to Part B, `azd up` creates a new registration and **overwrites both env files** with its values. You can skip A and B in that case.

## 5. Ports: only if both apps run at the same time

Both copies default to backend **8080** and frontend **5173**. If you run only one app at a time, skip this step.

To run them side by side, give the new app e.g. **8081 / 5174**:

| File | Change |
|---|---|
| [backend/WebApp.Api/Properties/launchSettings.json](../backend/WebApp.Api/Properties/launchSettings.json) | `"applicationUrl": "http://localhost:8081"` |
| [frontend/vite.config.ts](../frontend/vite.config.ts) | `server.port: 5174` and proxy `target: "http://localhost:8081"` |
| [backend/WebApp.Api/appsettings.Development.json](../backend/WebApp.Api/appsettings.Development.json) | `CORS.AllowedOrigins`: add `http://localhost:5174` and `http://localhost:8081` |
| [deployment/scripts/start-local-dev.ps1](scripts/start-local-dev.ps1) | Change `@(8080, 5173)` to `@(8081, 5174)` and the printed URLs |
| Entra app registration (Option A, B or C) | **Authentication → Single-page application → add** `http://localhost:5174` |

> ⚠️ `start-local-dev.ps1` **kills whatever is listening** on its ports. Without the change above, starting one app stops the other.

Do **not** change the port inside the Docker/Container App setup (`ASPNETCORE_URLS=http://+:8080`). That port is internal to each container and doesn't conflict.

## 6. Run and verify

Check your Azure CLI login. The local backend calls Foundry as **you**:

```powershell
az login --tenant ce5c9e34-9906-4081-8a98-69ec394244f1
az account show --query "{tenant:tenantId, user:user.name}"
```

You already have access to the resource from the Finance app, so no new role is needed for an agent in the same project.

Start the servers, either with the script or with two terminals:

```powershell
# Option 1
.\deployment\scripts\start-local-dev.ps1

# Option 2
cd backend\WebApp.Api; dotnet run --launch-profile http        # terminal 1
cd frontend; npm install; npm run dev                           # terminal 2
```

Open http://localhost:5173 (or 5174) in a fresh InPrivate window and sign in.

| Check | Expected |
|---|---|
| http://localhost:8080/api/health | `200`, status healthy (doesn't test Foundry) |
| Chat header after sign-in | Shows the **new** agent's name |
| Send "Reply with READY" | Streams a reply |
| Backend log | `Loaded agent: name=<New-Agent-Name>, model=..., version=...` |

Restart the backend after any `.env` change. The agent is cached until restart.

---

## Part B: deploy the new app to Azure

`azd up` creates a **separate** resource group, container registry, Container Apps environment, container app, managed identity, App Insights and Entra app registration for the new app. It also grants that app's managed identity access to the shared Foundry resource. The Finance app is not touched, as long as you use a **new azd environment name**.

### 7.1 Prerequisites

| Need | Why |
|---|---|
| Azure Developer CLI (`azd`), Azure CLI, PowerShell 7 (`pwsh`), .NET 10 SDK, Node 22+ | Hooks run in pwsh |
| Docker Desktop (optional) | Without it, the image is built in ACR (cloud build) |
| Contributor **and** User Access Administrator (or Owner) on the subscription | Creates resources and role assignments |
| Owner / Role Based Access Control Administrator on `adhinan-0796-resource` | Grants the new app's managed identity access to Foundry |
| Entra permission to create app registrations | Bicep creates the sign-in app (`ai-foundry-agent-<env>`) |

### 7.2 Commands (run in the new folder)

```powershell
azd auth login --tenant-id ce5c9e34-9906-4081-8a98-69ec394244f1
az login --tenant ce5c9e34-9906-4081-8a98-69ec394244f1

# Find the Foundry region so the new app is deployed next to it
az cognitiveservices account show -n adhinan-0796-resource -g rg-adhinan-0048 --query location -o tsv

# New, unique environment name -> resource group "rg-<env>", Entra app "ai-foundry-agent-<env>"
azd env new rakta-hr-dev --location <foundry-region> --subscription <SUBSCRIPTION_ID>

# Point at the shared resource and the new agent (set ALL four)
azd env set AI_AGENT_ENDPOINT https://adhinan-0796-resource.services.ai.azure.com/api/projects/adhinan-0796
azd env set AI_AGENT_ID <New-Agent-Name>
azd env set AI_FOUNDRY_RESOURCE_GROUP rg-adhinan-0048
azd env set AI_FOUNDRY_RESOURCE_NAME adhinan-0796-resource

azd up
```

Why all four values matter:
- When `AI_AGENT_ENDPOINT` is pre-set, the pre-provision hook skips resource discovery. It then does **not** fill in `AI_FOUNDRY_RESOURCE_GROUP` / `AI_FOUNDRY_RESOURCE_NAME`, and the post-provision hook **skips the Foundry role assignment** ("[SKIP] AI Foundry role assignment"). The deployed app would then fail with 401/403 from Foundry.
- Setting `AI_AGENT_ID` yourself prevents the hook from picking up stray `AZURE_EXISTING_AGENT_ID` values or defaulting to the first agent in the project.

### 7.3 What `azd up` does

1. **preprovision**: validates login and maps or uses the values above.
2. **Bicep**: creates `rg-<env>` with ACR, Container Apps environment, managed identity, App Insights, the container app (placeholder image), and the Entra app with scope `Chat.ReadWrite`.
3. **postprovision**:
   - sets `api://<clientId>` and SPA redirect URIs (`localhost:5173`, `localhost:8080`, the container app URL)
   - assigns **Cognitive Services User**, **Cognitive Services OpenAI Contributor** and **Azure AI Developer** on `adhinan-0796-resource` to the new managed identity
   - **rewrites** `backend/WebApp.Api/.env` and `frontend/.env.local` with the new Entra app
4. **predeploy / deploy**: builds the image (local Docker or ACR) and updates the container app.

When it finishes, the browser opens the new app URL. It's also in `azd env get-value WEB_ENDPOINT`.

### 7.4 Things to know after deploying

| Topic | Detail |
|---|---|
| Local files overwritten | After `azd up`, local dev uses the **new** azd Entra app with scope `Chat.ReadWrite`. Any `ENTRA_SCOPE_NAME=SopeAdhinan` line is removed, which is correct for this app. If you had changed ports (step 5), add the new localhost port as a SPA redirect on the new registration. |
| Version pinning | `AI_AGENT_VERSION` is written to the local `.env` but **not** passed to the container app ([infra/main-app.bicep](../infra/main-app.bicep)). Azure always uses the newest agent version unless you add it to the Bicep env list. |
| Switch agent later | `azd env set AI_AGENT_ID <name>` then `azd provision` (updates the container app env var). |
| Code changes | `azd deploy` rebuilds and pushes the image only. |
| Role propagation | Fresh role assignments can take 5–10 minutes. Early 403s usually resolve on their own. |
| Remove the new app | `azd down` deletes **only** `rg-<env>` and its Entra app. The shared Foundry resource is never deleted. Its role assignments are left behind and can be removed manually. |
| Production sign-in | Users must be in tenant `ce5c9e34-...`. If the enterprise app requires assignment, add users or groups under **Enterprise applications → ai-foundry-agent-<env> → Users and groups**. |

---

## 8. Checklist

```text
[ ] Agent created and tested in Foundry          name: ______________________
[ ] Project endpoint confirmed                     .../api/projects/__________
[ ] New folder created (clone, or copy with root .env and .azure removed)
[ ] index.html title updated (optional)
[ ] backend/WebApp.Api/.env  -> AI_AGENT_ID = new agent name (no quotes)
[ ] Sign-in option chosen: A reuse / B new manual / C azd
[ ] Ports changed + redirect URI added (only if running both apps together)
[ ] Local test: header shows new agent, "Reply with READY" works
--- Azure ---
[ ] New azd env name: ______________   region: ______________
[ ] AI_AGENT_ENDPOINT, AI_AGENT_ID, AI_FOUNDRY_RESOURCE_GROUP, AI_FOUNDRY_RESOURCE_NAME set
[ ] azd up completed; postprovision shows 3 roles "[OK] ... assigned"
[ ] Deployed URL tested by a non-developer user
```

## 9. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Header still shows the old agent | Backend not restarted, or you edited the other folder's `.env` |
| `Agent '<x>' ... not found` / 404 from Foundry | `AI_AGENT_ID` is a GUID or misspelled (case-sensitive), or the agent is in a different project than `AI_AGENT_ENDPOINT` |
| `Agent '<x>' has no versions` | Save the agent at least once in Foundry |
| Local 401/403 from Foundry | `az login` uses the wrong tenant or account, or you lack Azure AI User on the resource or project |
| Deployed 401/403 from Foundry | Role assignment skipped (see 7.2) or still propagating; check `azd env get-values` for `AI_FOUNDRY_RESOURCE_*` and rerun `azd provision` |
| Sign-in error AADSTS50011 (redirect mismatch) | The port or URL you opened is not a SPA redirect URI on the app registration |
| API returns 401/403 after sign-in | `ENTRA_SCOPE_NAME` / `VITE_ENTRA_SCOPE_NAME` doesn't match the registration's exposed scope, or the frontend and backend use different client IDs |
| Starting one app stops the other | Both use the same ports; see step 5 |
| `AI_AGENT_ENDPOINT` becomes `undefined` after `azd up` | The root `.env` with `AZURE_EXISTING_*="undefined"` was copied. Delete it, `azd env set` the correct values, run `azd provision` |
