# 🏛️ Multi-Model Development Governance & Workflow

This document establishes the project governance, oversight hierarchy, and review protocol across models and chats for `Protocol0510`.

---

## 👥 Roles & Oversight Hierarchy

```
                      ┌────────────────────────────────────────┐
                      │          THE DIRECTOR (USER)           │
                      │  Sole Decision Maker & Final Approver  │
                      └──────────────────┬─────────────────────┘
                                         │ Direct Decisions & Veto
                                         ▼
                      ┌────────────────────────────────────────┐
                      │          GEMINI (ANTIGRAVITY)          │
                      │  Lead Systems Architect, Supervisor &  │
                      │               Final QA                 │
                      │   - Environment Setup & Constraints    │
                      │   - Technical Specifications & Flow    │
                      │   - Code Reviewer & Flow Inspector     │
                      │   - Live Builds, Tests & Final QA      │
                      └──────────────────┬─────────────────────┘
                                         │ Approved Specs & Reviews
                                         ▼
                      ┌────────────────────────────────────────┐
                      │           CLAUDE 4.6 SONNET            │
                      │        Implementation Engineer         │
                      │        - Pure Coding Execution         │
                      │        - Ultra-lean Chat Reporting     │
                      │        - Writes Directly to Files      │
                      └────────────────────────────────────────┘
```

---

## ⚡ Token Conservation & Communication Protocol

To prevent chat context window exhaustion:
1. **No Massive Code Dumps in Chat:** Claude Sonnet must write plans directly to `IMPLEMENTATION-PLAN.md` / `SPECS.md` and code directly into the project files.
2. **Ultra-Concise Chat Responses:** Keep chat messages under 3–5 bullet points. State what file was changed and ask the Director to review the file directly on disk.
3. **Review Checkpoint:** Sonnet pauses after updating each file for Director approval before proceeding.
