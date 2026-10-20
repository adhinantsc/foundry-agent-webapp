RAKTA Finance Agent: new authentication setup

Prepared for the current repository on 13 October 2026. This guide configures local development at http://localhost:5173 with the API at http://localhost:8080 and the existing Foundry agent. It documents setup; no Azure resources or runtime configuration were changed when this guide was created.

**1. Choose the registration layout**

Create two single-tenant app registrations in the same Entra tenant:

| Suggested name | Purpose | Redirect configuration |
|---|---|---|
| RAKTA-Finance-Web-Dev | React browser sign-in | Single-page application: http://localhost:5173 |
| RAKTA-Finance-API-Dev | Permission protecting the .NET API | No redirect URI |

This follows Microsoft's [client and API registration pattern](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-configure-app-access-web-apis). The repository also supports a combined registration, but this guide uses separate registrations so each purpose is clear.

The current code supports these two IDs locally. In Development, the API still calls Foundry with the developer's Azure CLI identity. Setting the backend client ID does not enable local on-behalf-of (OBO) authentication; the code explicitly disables OBO in Development.

**2. Collect these values**

| Value | Where to obtain it | Current value or choice |
|---|---|---|
| Directory (tenant) ID | App registration > Overview | Current configuration: ce5c9e34-9906-4081-8a98-69ec394244f1; confirm this is the intended tenant |
| SPA application (client) ID | Overview of the new Web app | New value required; called SPA_CLIENT_ID below |
| API application (client) ID | Overview of the new API app | New value required; called API_CLIENT_ID below |
| API Application ID URI | API app > Expose an API | api://API_CLIENT_ID |
| Scope name | API app > Expose an API | Use Chat.ReadWrite throughout this guide |
| Full delegated scope | URI plus scope | api://API_CLIENT_ID/Chat.ReadWrite |
| Frontend redirect URI | Web app > Authentication | http://localhost:5173 |
| Foundry project endpoint | Foundry project overview | https://adhinan-0796-resource.services.ai.azure.com/api/projects/adhinan-0796 |
| Foundry agent name | Foundry agent details | RAK-TA-Fin-Agent |
| Agent version | Foundry agent details | Optional; omit to resolve the latest version |
| Azure subscription ID | Azure subscription containing the Foundry resource | Needed for CLI account selection and IAM work |
| Foundry project/resource ARM ID | Azure resource properties | Needed by the administrator assigning RBAC, not by the app's chat request |
| Developer account | Account used for Azure CLI login | Must have Foundry project access |
| Initial browser test account | User or guest in the chosen tenant | Must be permitted to sign into the new Web enterprise application |

Use Application (client) IDs in the environment files, not Object IDs. No client secret, password, or Foundry API key is needed for this local setup. The supplied endpoint and agent name are existing local configuration values, not proof of live availability.

**3. Create the API registration and scope**

In Entra ID > App registrations > New registration:

1. Name: RAKTA-Finance-API-Dev.
2. Supported accounts: Accounts in this organizational directory only.
3. Leave Redirect URI empty and register.
4. Record its tenant ID and Application (client) ID.
5. Under Expose an API, set Application ID URI to api://API_CLIENT_ID.
6. Add an enabled scope with these values:

| Field | Value |
|---|---|
| Scope name | Chat.ReadWrite |
| Who can consent | Admins only, for this internal finance app |
| Admin consent display name | Use RAKTA Finance chat |
| Admin consent description | Allow the application to send messages and read responses through the RAKTA Finance API. |
| State | Enabled |

The scope is a custom permission belonging to this API. It is unrelated to Microsoft Graph's Chat.ReadWrite.All. See [exposing API scopes](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-configure-app-expose-web-apis).

**4. Create the browser registration**

1. Register RAKTA-Finance-Web-Dev in the same tenant, with single-tenant accounts.
2. Under Authentication, add the Single-page application platform.
3. Add http://localhost:5173 as its redirect URI and save.
4. Record the Application (client) ID as SPA_CLIENT_ID.
5. Keep implicit-grant access-token and ID-token checkboxes disabled. MSAL uses authorization code flow with PKCE. Leave the separate Allow public client flows setting disabled; it is not required for this SPA flow.

Keep localhost redirects out of the Web platform for this browser app. In particular, do not add http://localhost:8080 as a Web redirect. Microsoft ignores localhost ports when matching redirects, which caused the earlier platform conflict. The backend port is an API address, not a browser sign-in callback. See [localhost redirect matching](https://learn.microsoft.com/en-us/entra/identity-platform/reply-url#localhost-exceptions) and [SPA authorization code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow).

**5. Grant the browser access to the API**

On the Web app, open API permissions > Add a permission > My APIs. Select RAKTA-Finance-API-Dev, choose Delegated permissions, select Chat.ReadWrite, and add it. An Entra administrator must grant consent for this selected permission because step 3 uses an admin-only scope.

If the API does not appear under My APIs, assign an owner to both registrations and search under APIs my organization uses by API_CLIENT_ID. Allow directory changes to propagate before retrying.

If the Web enterprise application requires user assignment, assign the browser test user or their group under Enterprise applications > RAKTA-Finance-Web-Dev > Users and groups.

Graph chat permissions and Dynamics permissions are not prerequisites for this login and chat transport. Any Dynamics/MCP connection used inside the Foundry agent needs its own configured authorization; adding permissions to this new SPA does not automatically authorize those tools.

**6. Configure the local files**

Replace the existing authentication entries with these values, substituting actual IDs. Preserve unrelated configuration. Do not append duplicate keys or keep the old SopeAdhinan scope alongside the new settings.

frontend/.env.local:

```dotenv
VITE_ENTRA_TENANT_ID=TENANT_ID
VITE_ENTRA_SPA_CLIENT_ID=SPA_CLIENT_ID
VITE_ENTRA_BACKEND_CLIENT_ID=API_CLIENT_ID
VITE_ENTRA_SCOPE_NAME=Chat.ReadWrite
VITE_API_URL=/api
```

backend/WebApp.Api/.env:

```dotenv
AzureAd__Instance=https://login.microsoftonline.com/
ENTRA_TENANT_ID=TENANT_ID
ENTRA_SPA_CLIENT_ID=SPA_CLIENT_ID
ENTRA_BACKEND_CLIENT_ID=API_CLIENT_ID
ENTRA_SCOPE_NAME=Chat.ReadWrite
AI_AGENT_ENDPOINT=https://adhinan-0796-resource.services.ai.azure.com/api/projects/adhinan-0796
AI_AGENT_ID=RAK-TA-Fin-Agent
ASPNETCORE_ENVIRONMENT=Development
```

If pinning a version, also set AI_AGENT_VERSION to its version number. Use plain unquoted values in the backend file: its custom .env loader does not remove quotes. Remove obsolete AzureAd__ClientId, AzureAd__TenantId, and AzureAd__Audience overrides when replacing them with the ENTRA variables above.

The current Program.cs accepts API_CLIENT_ID as an audience when ENTRA_BACKEND_CLIENT_ID is set. The frontend requests the scope on that API ID and sends the resulting access token to the .NET API.

Check for old authentication variables in the shell before launching. Vite also checks .azure/<environment>/.env; if it exists, its ENTRA_SPA_CLIENT_ID and ENTRA_TENANT_ID can override frontend/.env.local through vite.config.ts. Align those values if that environment is in use. This guide assumes the current local layout, with no conflicting .azure configuration. Restart both servers after changing values.

**7. Authenticate the backend to Foundry**

For local development, have the resource administrator grant the developer account Foundry User (formerly Azure AI User) on the target project, with resource Reader access if needed for discovery. This app reads agent metadata and uses conversations/files as well as inference. A role limited to agent endpoint invocation may not cover those operations. Use [Foundry RBAC guidance](https://learn.microsoft.com/en-us/azure/foundry/concepts/rbac-foundry) for the applicable scope.

Sign into Azure CLI on the same computer and OS account that runs the backend:

```powershell
az login --tenant TENANT_ID
az account set --subscription SUBSCRIPTION_ID
az account show --query "{tenant:tenantId,subscription:id,user:user.name}" --output json
```

These are instructions to run yourself, not commands executed by this guide. Browser login and CLI login are separate. The CLI account must be able to access the Foundry endpoint's network as well as have the required role. Azure Developer CLI is an optional credential fallback in this code; Azure CLI alone is sufficient for this local path.

**8. Start the software**

Prerequisites: .NET 10 SDK, Azure CLI, and a Node version supported by the installed Vite package (Node 22.12+ is a suitable baseline). Open two terminals in the repository root.

Backend terminal:

```powershell
Set-Location backend/WebApp.Api
dotnet restore
dotnet run --launch-profile http
```

Run from backend/WebApp.Api so Program.cs finds its .env file. The http launch profile sets Development and listens on port 8080.

Frontend terminal:

```powershell
Set-Location frontend
npm.cmd ci
npm.cmd run dev -- --port 5173 --strictPort
```

Use npm.cmd install instead of npm.cmd ci only if no package-lock.json exists. strictPort prevents Vite silently moving to another port. If a port is occupied, stop the existing instance of this software before restarting.

Open a fresh InPrivate browser session at http://localhost:5173 and sign in. Start a fresh login after changing app IDs; an old authorization code must not be reused.

**9. Verify each stage**

| Stage | Expected result | What failure usually points to |
|---|---|---|
| GET http://localhost:8080/api/health | 200 with status healthy | Backend startup/listening; this endpoint does not test Foundry |
| Microsoft token request | Successful token redemption | AADSTS9002326: wrong platform, conflicting redirect, or frontend still using old client ID |
| GET /api/agent from the signed-in UI | 200 and the real RAK-TA-Fin-Agent metadata | 401: token validation; 403: API scope/policy; 500: inspect backend error for Foundry credential, permission, endpoint, or agent problems |
| POST /api/chat/stream | SSE conversationId, text chunks, usage, done | Inspect error events and backend logs; HTTP 200 alone does not prove streaming succeeded |
| Follow-up in same chat | Same conversation ID and continuing context | Conversation state or response-processing issue |

Send a simple prompt such as "Reply with READY" before testing business tools. Successful plain text chat confirms basic I/O; it does not prove Dynamics/MCP tools are authorized.

An example browser-to-backend request body is:

```json
{
  "message": "Reply with READY",
  "conversationId": null
}
```

The request also needs Authorization: Bearer <API access token>. The application supplies it through MSAL. Never share access tokens or authorization headers when reporting errors.

The existing UI still needs separate error-handling improvements: failed login can leave the spinner active, and failed metadata loading displays a fallback agent. Use Network responses and backend logs as the verification evidence.

**10. Values to return for wiring and review**

```text
Tenant ID:
New Web application (client) ID:
New API application (client) ID:
API Application ID URI:
Scope name: Chat.ReadWrite
SPA redirect URI: http://localhost:5173
Admin consent granted: yes/no
Foundry endpoint: confirm existing value or provide replacement
Agent name: RAK-TA-Fin-Agent (confirm)
Agent version: latest, or number
Subscription ID:
Foundry project/resource ARM ID (for RBAC review):
Developer CLI account and Foundry role confirmed: yes/no
Production frontend URL, if deployment is also required:
```

IDs and endpoints are configuration values. No client secret is requested.

**11. Before using this setup in Azure production**

This local checklist is not a complete production deployment procedure. With ENTRA_BACKEND_CLIENT_ID configured and ASPNETCORE_ENVIRONMENT other than Development, the current service automatically selects OBO. Production therefore additionally needs an attached user-assigned managed identity, MANAGED_IDENTITY_CLIENT_ID, a federated credential on the API registration, downstream Foundry delegated permission/consent, and appropriate access for the users. The repository's optional OBO infrastructure contains those concepts, but must be aligned with these manually created registrations before deployment.

Register the actual HTTPS frontend origin as a SPA redirect and rebuild the frontend with the new IDs. Frontend environment values are embedded at build time. The existing provisioning templates create registrations, so running a fresh provisioning workflow is not automatically a way to reuse the manual registrations from this guide.

Local CLI mode uses one developer identity for Foundry calls. The app does not enforce per-user conversation ownership in this mode; confirm the intended conversation access model before shared finance use.
