# Outline and review record — issue #14

Audience: managers and system leads; 12–15 minutes; no HDL or equations required.
Objectives: explain the sampling hazard (O1), explain the purpose and limits of two receiving-clock registers (O2), distinguish a level from events/words/streams (O3), ask for meaningful CDC evidence (O4).

## Outline passes before implementation
1. Subject accuracy: replaced “no synchronizer causes metastability / two clocks fixes it” with setup/hold violation at asynchronous sampling; both synchronizer stages use the destination clock. Added old-value and long-resolution cases so the demo cannot imply guaranteed capture or elimination.
2. Learner pacing: begin with a sensor READY signal and explain flip-flop and clock edge before introducing CDC. Keep equations, RTL, device-specific constraints and FIFO implementation out of the main lesson.
3. Instructional design: use one adjustable timeline with side-by-side exposed and contained paths; pause/scrub for meetings, presets for normal/near-edge/old-value/long-resolution/short-pulse cases. Four short reasoning activities suit the deliberately brief scope. End with a manager's design-review checklist.

## Final outline
1. READY arrives between unrelated schedules: why apparently good lab tests can miss a hazard (O1).
2. Sampling window and delayed resolution, with illustrated live timeline (O1).
3. Same experiment, two destination-clock flip-flops: waiting, latency, residual risk (O2).
4. One bit versus a short event, whole word or stream: mailbox/FIFO overview (O3).
5. Review evidence and four reasoning activities (O4 and O1–O3).
6. Glossary and primary sources. No device reliability predictions.

## Verification and five final review passes
To be completed after implementation; tests verify the teaching model, not physical silicon.

## Completed five-pass self-review (AI-assisted author review)
1. Accuracy: corrected guarantee language and distinguished two flip-flops from two clocks. Both stages use clock B. Explicit old-value and residual-risk scenarios. Displayed M is a teaching symbol, not a logic level or measured waveform. Checked against Intel metastability analysis/AN42 summaries and Friedrichs et al. 2016 primary paper; handshake requirement checked against AMD XPM_CDC_HANDSHAKE documentation. AMD synchronous-clock documentation supports fixed phase distinction. No measured failure rates claimed.
2. Teaching completeness: defined clock, flip-flop and sampling window before the experiment. Added persistent sensor READY example and thirty-second verbal explanation criteria. Equations and RTL intentionally omitted.
3. Application/mistakes: four exercises map to O1–O4; feedback explains choices. Added missed pulse and changing-word coherence warnings. Reduced from six exercises because this is a deliberately short manager briefing, not a full engineering deep dive.
4. Presentation/usability: inspected labels, semantic headings, focus styles, SVG accessible description, scrollable timeline, no autoplay, pause/step/reset and dark-mode styles. Found stale quiz completion after changing an answer; implementation clears completion when selection changes. Real browser checks remain BLOCKED: installed Playwright initially lacked matching Chromium, and available Chromium failed with `socket() failed: Operation not permitted`. No visual/browser pass claimed.
5. Integration: model and root catalog tests pass; existing catalog discovers new hardware lesson and builds all eight lessons. Added model/browser steps to the existing manually dispatched site workflow without changing triggers or creating a publisher. Standalone app has no external assets. Git diff checked for unrelated edits.

## Traceability / actual checks
| Objective / request | Evidence | Status |
|---|---|---|
| O1: asynchronous sampling hazard | intro + arrival slider + model outside-window test | automated model pass |
| O2: same-clock stages, delay, residual risk | experiment + near/old/long tests | automated model pass |
| O3: CDC overview stays brief | one comparison table + missed-pulse test | reviewed / model pass |
| O4: manager review judgment | checklist + exercise 4 | source reviewed; browser feedback test pending |
| HTML interactive and offline | single file; no asset requests; provided Playwright file:// test | static inspection only; browser blocked |
| Catalog / metadata | four root tests, catalog check and build | pass on Linux |
| Mobile / dark / keyboard / motion | CSS, semantic controls, browser script | browser verification pending |

No independent human review performed. CI is deliberately manual/release-candidate only; ordinary PR creation is not a CI pass.

## v1.1.0 update review
- User requested a visible counter failure and an RTG4 implementation sidebar. Added an unsafe count-enable model: hold 3 (0011) versus increment 4 (0100), with independent per-bit enable decisions. Selecting only bit 2 yields 7 (0111). This models one possible resolved corrupted state, not additional clock pulses or a probability distribution. Compared with a settled, timed FF2 enable at a later receiving edge; explicitly retained event-protocol and residual-risk limits.
- Added actual Synplify attribute syntax and RTG4 PDC command forms verified against primary Microchip-hosted manuals. Synthesis preservation is distinct from placement locking. All location values are placeholders; select legal nearby sites or a small region using actual netlist macro names. Templates were not run in Libero.
- Microchip RTG4 Fabric Guide identifies clusters of 12 logic elements; AN6287 §5.1 recommends additional stages above 125 MHz. Sidebar preserves need for design-specific analysis below that threshold too.
- Eight model/package tests pass, including all 256 old-value/update-mask combinations in the four-bit counter and coherent hold/increment controls. Catalog check/build passes. Extended browser smoke checks for counter apply/reset/hold; browser execution remains blocked as documented above.
- Reviewed scope: manager-facing explanation stays short; technical directives are in a collapsed engineering sidebar, linked beside FF2. Version updated to 1.1.0.
