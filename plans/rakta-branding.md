# RAKTA platform branding

Rebrand the chat web app from the generic "Azure AI Agent" template to a RAK Transport Authority internal assistant. The design must stay **agent-agnostic**: the same build is copied per agent (Finance now, others later, see `deployment/NEW-AGENT-PROJECT-SETUP.md`), so the agent name, description and starter prompts keep coming from Foundry metadata.

## Brief (proposed, confirm)

| | |
|---|---|
| Subject | RAKTA's internal AI assistants, starting with the Finance agent |
| Audience | RAKTA staff (finance team first), on desktop, in a government setting |
| Primary job | Ask an agent a question and get a trustworthy answer, often with figures and tables |
| Tone | Official, calm and precise. It should read as an authority's tool, not a startup's toy. |

## Tokens

### Colour (sampled from the logo)

| Name | Hex | Role |
|---|---|---|
| RAKTA Blue | `#00498F` | Brand: user messages, primary buttons, links, active states |
| Night Route | `#0B2340` | Header band, dark-theme surfaces |
| Lane Gold | `#BA8C0A` | The one accent: the lane line under the header, the focus ring, the active marker. **Never text** (2.9:1 on white). |
| Asphalt | `#58595B` | Secondary text, the logo's English wordmark colour |
| Signal White | `#F5F7FA` | App background (cool, not cream) |
| Plain White | `#FFFFFF` | Message area, input, panels |

The Fluent `BrandVariants` ramp is rebuilt around `#00498F` (slot 80), so every Fluent component (buttons, focus, links, menus) inherits RAKTA blue automatically.

### Type

- **Readex Pro** (Google Fonts, self-hosted via `@fontsource-variable/readex-pro`, so there is no external call from the government network). One family for everything. It's a geometric sans designed for Arabic **and** Latin together, its round forms echo the lowercase "rakta" wordmark, and it covers a future Arabic UI without a second font.
- Scale (1.25 ratio): 13 / 14 / 16 / 20 / 25 / 31 px. Body 15px / 1.6, message text max ~72ch.
- Weights: 400 body, 500 UI labels, 600 headings. Sentence case everywhere, no all-caps labels.

### Layout

A new **header** (the app has none today) and a restyled empty state; the chat column stays centred at 900px.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [rakta logo]  │  Finance Assistant                 (history) (new) (⋯)│  Night Route band, 56px
├━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┤  2px Lane Gold line
│                                                                      │
│        Good morning, Adhinan                                         │  25px / 600, left-aligned
│        Ask about budgets, invoices, vendors and GL balances.         │  agent description from Foundry
│                                                                      │
│        ▌ What is the budget variance for Q3?                         │  starter prompts as a list:
│        ▌ Show unpaid vendor invoices over 30 days                    │  blue left rule, full row hit area,
│        ▌ Summarise this month's GL postings                          │  gold rule on hover/focus
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│        [ Ask the Finance Assistant…                     📎 🎤  ➤ ]   │  white input, 1px border, blue send
│        Responses are AI-generated. Check figures before you use them.│  13px Asphalt, replaces Foundry badge
└──────────────────────────────────────────────────────────────────────┘
```

- The logo sits on the dark band inside a **white plate** (rounded 6px, 8px padding). The PNG has navy glyphs, and the plate keeps them legible in both themes without recolouring the brand mark.
- Conversation: **user** messages are RAKTA Blue bubbles with white text, right-aligned. **Assistant** messages have no bubble: plain text on white with a small agent avatar, so tables and long answers have room.
- Mobile (<600px): the header shows only the plate logo and icon buttons; the agent name moves to the empty-state heading.

### Principles

1. **Spend boldness once:** the dark header band with the gold lane line is the RAKTA signature. Everything below is quiet: white, blue, grey.
2. **Signage, not decoration:** like road signs, colour carries meaning. Blue means "you / action", gold means "where you are / focus". Nothing is coloured just to look nice.
3. **Trust over delight:** remove the purple animated waves and the "Built with Microsoft Foundry" button, and add the plain AI-accuracy note, which matters for finance figures.

### Review against the generic default

- *Default I'd have reached for:* starter prompts as three rounded cards with soft shadows (the current UI, "SaaS-card kit"). **Changed to** a left-aligned list with a blue rule, which reads like a route list and scans faster.
- *Default:* Inter / Segoe for type. **Changed to** Readex Pro, chosen for Arabic + Latin coverage and its match with the wordmark.
- *Default:* gradient or animated background in the input area (current purple waves). **Removed.** The gold line is the only "ornament".
- The navy + gold palette is not a stylistic pick but the client's own brand, so it stays.

## Changes by file

| File | Change |
|---|---|
| `frontend/src/assets/rakta-logo.png` | New: the supplied logo (480×72, transparent) |
| `frontend/package.json` | Add `@fontsource-variable/readex-pro` |
| `frontend/src/config/themes.ts` | RAKTA brand ramp; light + dark themes with Readex Pro as `fontFamilyBase`; dark surfaces tinted to Night Route |
| `frontend/src/index.css` | Font import, `--rakta-*` CSS tokens, body background |
| `frontend/src/components/core/AppHeader.tsx` + `.module.css` | **New** header: logo plate, agent name, history / new chat / more menu |
| `frontend/src/components/AgentChat.tsx` | Render `AppHeader` above the chat; pass handlers |
| `frontend/src/components/chat/ChatInput.tsx` | History and New chat move to the header; the input keeps attach / voice / stop / send. The "More" menu moves to the header. |
| `frontend/src/components/ChatInterface.tsx` + `.module.css` | Remove `Waves` and `BuiltWithBadge`; add the AI-accuracy note; placeholder "Ask the {agentName}…" |
| `frontend/src/components/chat/StarterMessages.tsx` + `.module.css` | Greeting with the user's first name (from MSAL), left-aligned layout, prompt list styling |
| `frontend/src/components/chat/UserMessage.module.css`, `AssistantMessage.module.css` | Bubble colours; replace the per-message fade-slide with nothing (the stream itself shows arrival) |
| `frontend/src/App.tsx` | Loading screen uses the logo; document title `"{agent} | RAKTA"`; fallback name "RAKTA Assistant" |
| `frontend/index.html` | `<title>RAKTA Assistant</title>`, description, favicon (cropped "r" mark from the logo) |
| `frontend/src/components/animations/Waves.*`, `core/BuiltWithBadge.*`, `icons/AIFoundryLogo.tsx` | Delete if unused afterwards |

Backend: only the small `displayName` addition described under Decisions.

## Quality floor

- WCAG AA: white on `#00498F` = 8.3:1, `#58595B` on white = 7.0:1, white on `#0B2340` > 14:1. Gold is used only for non-text marks at ≥3:1 against its background.
- Visible keyboard focus everywhere (2px Lane Gold outline + offset).
- `prefers-reduced-motion` respected (there is little motion left anyway).
- Responsive to 320px; no horizontal scroll.
- Existing tests (`npm run test:run`) and `npm run build` must pass.

## Verification

1. `npm run build` and `npm run test:run`.
2. Run locally and capture screenshots: empty state, a conversation with a table, the history panel, dark theme, and 375px mobile.
3. Review the screenshots against this plan before handing over.

## Decisions (answered 2026-10-20)

1. **Language:** English only for now. Readex Pro keeps Arabic/RTL possible later.
2. **Theme:** keep light / dark / system. Dark uses Night Route surfaces; the logo stays on its white plate.
3. **Agent display name:** new env var `AI_AGENT_DISPLAY_NAME` (e.g. `Finance Assistant`) in **`backend/WebApp.Api/.env`**, next to `AI_AGENT_ID`, the same file already edited per agent copy. The backend returns it as `displayName` from `/api/agent`; the frontend shows `displayName ?? name`. It's read at runtime, so the Docker build needs no build-arg plumbing (a `VITE_` variable would need changes in the Dockerfile and `predeploy.ps1`).
   - Also: `infra/main-app.bicep` + `main.bicep` pass it to the container app (optional, empty by default); `postprovision.ps1` writes it into the generated backend `.env`; the per-agent guide (step 4) mentions it.
   - Backend files: `Models/AgentMetadataResponse` (+ `DisplayName`), `AgentFrameworkService.GetAgentMetadataAsync`; frontend `types/chat.ts` (`IAgentMetadata.displayName?`).
