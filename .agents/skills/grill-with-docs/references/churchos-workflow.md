# ChurchOS workflow references

## Project sources

Read AGENTS.md and README.md first. Find current successors rather than freezing these dated paths as permanent authority:

- docs/operations/ecosystem-v1/DETAILED_DESIGN_V1.5.md
- docs/operations/ecosystem-v1/OPERATING_SCENARIOS.md
- docs/operations/ecosystem-v1/FEATURE_MATRIX_V1.5.csv
- docs/operations/ecosystem-v1/CONTRACT_BACKLOG_V1.5.md
- docs/operations/ecosystem-v1/APP_ONLY_OPERATIONS.md
- docs/operations/ecosystem-v1/WORD_AND_SERMONS.md
- docs/development/SKILL_USAGE.md

Read only sources relevant to the current review, not the entire repository each time.

## Decision format

Record ID; status AGREED/PROPOSED/OPEN/SUPERSEDED; date; source of authority; topic; decision; reason; alternatives; affected products/data/roles/screens/contracts/tests; remaining evidence. Link superseding decisions rather than deleting history. Do not invent user quotations. Keep terminology definitions free of implementation details.

## Provenance

Project-specific self-contained adaptation, not an unchanged installation of Matt Pocock's package or an official OpenAI skill. Consulted 2026-10-24:

- https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md
- https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md
- https://github.com/mattpocock/skills/blob/main/skills/engineering/domain-modeling/SKILL.md

The upstream entry delegates to grilling and domain-modeling. This adaptation combines their purposes with ChurchOS boundaries, limited questions per round, existing-decision reuse and explicit implementation tracking. It does not depend on a Skill tool or those separately installed dependencies. Review future upstream changes rather than automatically overwriting this adaptation.
