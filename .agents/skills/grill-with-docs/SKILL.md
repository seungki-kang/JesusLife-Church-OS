---
name: grill-with-docs
description: Review ChurchOS designs through focused Korean questions, shared terminology, and documented decisions. Use when the user explicitly requests grill-with-docs or a ChurchOS design interview with glossary and decision updates. Do not use for simple edits, status checks, or routine implementation.
---

# ChurchOS grill-with-docs

Run a self-contained ChurchOS adaptation of interview and domain-modeling practices. Consult [project workflow](references/churchos-workflow.md) for sources and record formats. Do not require other installed skills or a remote issue tracker.

## Establish scope

1. Identify the requested topic and actual repository root. Read applicable AGENTS.md, the current index and only relevant design, glossary, decision, API and code files. Do not assume a Windows directory exists in this environment.
2. Separate agreed requirements, new proposals and actual implementation. State a narrow review scope in Korean. Preserve existing decisions rather than restarting the ecosystem design.
3. If sources are unavailable, mark missing evidence and prepare a draft. Do not claim that files, repositories or user memory were updated without a successful save.

## Interview through dependencies

1. Map settled choices, unresolved choices, prerequisites and inspectable facts as a decision tree.
2. Investigate facts yourself. Ask for product/business choices, not facts already in code or documents. Do not delegate unless separately authorized by current instructions.
3. Ask one high-impact question by default, at most three independent questions per round. Give a recommendation, reason and meaningful alternatives. Make the actual decision explicit; silence is not agreement.
4. Wait for required choices before dependent implementation. Continue independent investigation and record OPEN items. Do not invent a blanket permission gate for already authorized work.
5. Recompute the tree after each answer and ask only unresolved questions. Keep explanations readable; do not default to Caveman compression during design or learning.
6. Probe another church, revoked roles, duplicate writes, editing conflicts, public/private material, provider failure, withdrawal, account exit and changed source versions.

## Preserve project boundaries

- Keep church members and administrators in the mobile app; do not require a ChurchOS admin website.
- Preserve seven independent products and API ownership. In-app UI does not transfer the provider's data ownership.
- Keep prayer records in JLPrayer; Bible/hymn content rights and reading plans in JLBible. Reading a passage does not complete a reading plan.
- Keep Academy optional and connect participating churches to Neorang-Narang and especially Life Diary practice. Enrollment does not grant personal content access.
- Do not receive Life Diary text, completion or session counts in ChurchOS. Keep private prayer/relationship content out of church operational storage, logs and dashboards.
- Keep CHGO an independent engine for all products with scoped contracts. Separate conceptual grounding, transcription, generation and pastoral approval; do not centralize personal data.
- Default sermon video to linked hosting. Separate direct video hosting and independent church app construction services.
- Preserve applied migrations, stable IDs, history and the v2.6 validation snapshot. New requirements are not implemented merely because documents change.

## Document settled choices

1. Reuse the existing glossary or create root GLOSSARY.md for settled domain terms. Keep endpoints, storage details and implementation status outside the glossary.
2. Clarify attendance, enrollment, completion, maturity, personal sharing, church roles and product permissions. Check code for contradictions and surface them.
3. Reuse decision logs and ADR conventions. Create ADRs sparingly for consequential trade-offs whose rationale future readers need; put routine choices in a working decision log.
4. Record ID, status, date, authority, choice, reason, alternatives, affected artifacts and missing evidence. Label historical confirmations accurately; leave unanswered choices PROPOSED/OPEN.
5. Update scenarios, permissions, screens, features and contracts within authorized scope, preserving IDs and linking consequences. Do not silently treat current code as desired policy.
6. Do not invent provider APIs, data rights, prices, approvals or test runs. Distinguish DESIGN, IMPLEMENTED, PASS, FAIL and NOT_RUN.

## Close

Summarize in Korean: settled choices, open choices, changed documents, implementation gaps and the next small task. Check local links and references. Report checks and limits honestly. Follow task-branch and commit/PR policy; never claim remote sync or installation without successful save.
