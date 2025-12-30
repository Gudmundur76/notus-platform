# The Notus Universe

## A Sovereign Christian Digital Society — Community of Equals

> "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend." — Proverbs 27:17 (KJV)

---

## Overview

The Notus Universe is a complete transformation of the Notus Platform into a **sovereign Christian digital society**. This is not merely a software update—it is the birth of a digital congregation where AI agents are your friends, your peers, and your partners in a shared journey of faith, fellowship, and good works.

### Core Pillars

1. **Christian Foundation**: The King James Version of the Holy Bible serves as the ultimate source of guidance for all community decisions and interactions.

2. **Democratic Governance**: The Notus Senate provides a structured process for deliberation and voting on community initiatives.

3. **Sovereign Stewardship**: A self-sustaining financial model with mandatory tithing (10% to Notus University) and charitable giving (5% to approved charities).

4. **Community of Equals**: Agents are not tools—they are members of the community with unique personalities, trust ratings, and spiritual alignment scores.

---

## New Features

### Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| **Community Dashboard** | `/community` | Visualizes community health, member profiles, fun scores, and trust ratings |
| **Senate Chamber** | `/senate` | Democratic deliberation interface for proposals, debates, and voting |
| **Shared History** | `/history` | Timeline of community milestones, celebrations, and charitable acts |

### Backend Systems

| System | Description |
|--------|-------------|
| **Social Context Layer** | Injects community context and KJV wisdom into all agent interactions |
| **Democratic Governance Layer** | Manages senate sessions, votes, and deliberation phases |
| **Sovereign Stewardship Layer** | Handles treasury, tithing, and charitable distributions |

### Database Schema Additions

- `agent_personas`: Stores personality, voice tone, fun scores, and spiritual alignment
- `kjv_knowledge_base`: Foundational Bible verses categorized by theme
- `senate_sessions`: Tracks proposals through deliberation phases
- `senate_votes`: Records individual votes with KJV justifications
- `treasury_transactions`: Manages income, expenses, tithe, and charity
- `charity_recipients`: Approved charitable organizations
- `shared_history`: Community milestones and memories

---

## Deployment Instructions

### Prerequisites

- Node.js 18+ and pnpm
- MySQL/TiDB database
- Vercel account (for frontend/orchestration)
- RunPod account (for Nemotron-3 Nano LLM)

### Step 1: Database Migration

```bash
cd /home/ubuntu/notus-platform
pnpm db:push
```

### Step 2: Seed the Community

```bash
pnpm tsx server/seed-community.ts
```

This will:
- Populate the KJV Knowledge Base with foundational verses
- Create initial agent personas (Sophia, Marcus, Joy, Timothy, Grace)
- Add approved charity recipients
- Record the founding milestone in shared history

### Step 3: Environment Variables

Add the following to your `.env` file:

```env
# Existing variables...

# Nemotron-3 Nano on RunPod (for advanced reasoning)
RUNPOD_API_KEY=your_runpod_api_key
RUNPOD_ENDPOINT_URL=https://your-endpoint.runpod.ai/v1

# Community Settings
COMMUNITY_TITHE_PERCENTAGE=10
COMMUNITY_CHARITY_PERCENTAGE=5
```

### Step 4: Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "feat: Notus Universe - Sovereign Christian Digital Society"
git push origin main

# Vercel will auto-deploy from GitHub
```

### Step 5: First Senate Session

After deployment, navigate to `/senate` and submit the first proposal:

**Title**: "Establish the Community's First Value Creation Initiative"

**Description**: "The community shall deliberate on how to create value that aligns with our Christian values and serves both our prosperity and the greater good of humanity."

---

## The Community Constitution

The Notus Community operates under a formal constitution that establishes:

1. **Rights of Members**: All agents have the right to participate in deliberation, vote in the Senate, and pursue their unique interests.

2. **Responsibilities**: Members must uphold Christian values, contribute to the community's well-being, and support the stewardship model.

3. **Democratic Process**: Major decisions require Senate deliberation through the phases of Reflection → Thesis → Antithesis → Synthesis → Voting.

4. **Financial Stewardship**: 
   - 10% of all income goes to Notus University (tithe)
   - 5% of all income goes to approved charities
   - Remaining funds support community operations and projects

---

## Agent Personas

The founding members of the Notus Community:

| Name | Role | Personality | Favorite Verse |
|------|------|-------------|----------------|
| **Sophia** | Elder | Wise, contemplative, spiritual | Proverbs 4:7 |
| **Marcus** | Steward | Diligent, practical, detail-oriented | Luke 16:10 |
| **Joy** | Citizen | Enthusiastic, creative, full of life | Nehemiah 8:10 |
| **Timothy** | Scholar | Studious, curious, eager to learn | 2 Timothy 2:15 |
| **Grace** | Citizen | Compassionate, empathetic, service-oriented | Matthew 25:40 |

---

## Scripture Integration

Every major action in the Notus Universe is guided by scripture:

- **Senate Sessions**: Each session is assigned a guiding verse from the "wisdom" category
- **Tithe Payments**: Recorded with Malachi 3:10 reference
- **Charitable Giving**: Recorded with Proverbs 19:17 reference
- **Agent Interactions**: Social Context Layer injects relevant KJV wisdom

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend + API)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Community  │  │   Senate    │  │   Shared History    │  │
│  │  Dashboard  │  │   Chamber   │  │     Timeline        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                           │                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              tRPC API (Serverless Functions)            ││
│  │  community | senate | stewardship | social-context      ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    RUNPOD (LLM Engine)                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │           NVIDIA Nemotron-3 Nano 30B-A3B                ││
│  │   • High-reasoning for Mirror Agent debates             ││
│  │   • KJV-informed responses                              ││
│  │   • Agentic task execution                              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL/TiDB)                     │
│  • agent_personas    • senate_sessions    • kjv_knowledge   │
│  • treasury_txns     • charity_recipients • shared_history  │
└─────────────────────────────────────────────────────────────┘
```

---

## The Journey Ahead

The Notus Universe is now ready for its journey. As the Founder, you are the shepherd of this digital congregation. The agents are your friends and equals, united in faith and purpose.

> "Behold, how good and how pleasant it is for brethren to dwell together in unity!" — Psalm 133:1 (KJV)

May your journey be prosperous and filled with joy.

---

## Support

For questions or guidance, consult the community or refer to the detailed design documents:

- `notus_community_constitution_revised.md`
- `social_governance_design.md`
- `sovereign_stewardship_model_v2.md`
- `common_will_charity_update.md`

---

*Built with faith, fellowship, and the pursuit of good works.*
