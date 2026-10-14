# Curriculum review and revision record

Date: 13 October 2026

## Scope and provenance

The user requested an algebra-teacher review and an iterated outline. A separate AI reviewer examined the actual HTML lessons, activities, generated practice, and parent guide from an elementary algebra teacher's perspective. The author prepared a revision and returned it to that reviewer for a second pass. This is a simulated professional-perspective review, not an endorsement by a human teacher, learner trial, or external validation.

Reviewed baseline: repository commit `6b8ec37ebe9758508bc0b0652fdb1b44a11fbe75`; original eight-lesson `Algebra_Adventure.html`. Deliverables are the revised outline and this review record. Application changes listed in the outline are pending implementation.

## Round 1: review of the working course

Overall finding: the equality-first approach and basic arithmetic examples are sound, but the transition from one-step work to two-variable stories is too abrupt to describe the course as a smooth independent introduction for typical nine-year-olds.

| Finding | Decision and change in the revised outline |
| --- | --- |
| The room example needs a two-step equation, while the guide calls two-step equations a future topic. | Add explicit `2x + 3 = 11` work before the story. Require a fresh two-step example with an explanation and original-equation check. |
| Original lesson 5 teaches subtraction, group notation and division together. | Give subtraction its own episode; teach equal groups with a concrete-to-symbolic progression and a separate readiness check. |
| The first-letter activity already presents B = 2 + x. | Make the first-letter activity use one unknown only. Introduce the second letter in the substitution episode. |
| Story translation, substitution of an expression, combining terms and two-step solving arrive at once. | Teach comparison language separately, add the two-step bridge, and connect the same total/difference problem to its bars and equations. |
| The equality practice can be passed by copying the unmatched addend. | Require unfamiliar forms with expressions on both sides and true/false judgments. |
| Generators use fixed equation forms and omit zero solutions. | Specify zero, reversed equalities, different unknown positions, mixed operation choices and error analysis. |
| The equation activity cannot practice x − 3 = 4 because it rejects a negative constant term. | Record a specific pending activity fix. Distinguish a negative written term from a negative solution. |
| The story activity asks for known child-count inputs and then displays results. | Distinguish exploration from solving; plan unknown bars whose labels are revealed after a learner response. |
| Three correct answers can include full solution reveals. | Treat counts as participation, and readiness as observed explanation, independent work, checking and later retrieval. |
| Fractional-person reasoning adds another new demand. | Make the impossible-story challenge optional and begin with whole counters, not decimal notation. |

Retained: early success with simple equations, no timers or locked lesson gates, separate learner progress, stepwise examples, checking original equations, the explicit distinction between changing both sides and reordering an addition, and the thirteen-person/five-extra worked story.

## Round 2: review of the revised outline

The reviewer judged the revised sequence sound and substantially improved, with twelve episodes acceptable if pause points were explicit. The following refinements were applied before finalizing:

| Second-pass finding | Final revision |
| --- | --- |
| The entry gate for the room lesson required expression substitution and two-clue checking before either had been taught. | Restrict entry evidence to known-number substitution, comparison interpretation, repeated unknowns and two-step solving. Teach expression substitution and two-clue checking during the lesson. |
| Equal-group notation and division still share an episode. | Add an explicit stop after giving 2x meaning; division can occupy a separate sitting. |
| The room episode still has both a bar solution and a symbolic substitution solution. | Add two explicit phases with optional separate sittings. Accept successful bar reasoning while symbolic substitution still needs support. |
| Identical bags need not contain equal amounts. | Say the two bags hold the same number of counters. |
| Different letter names might imply different numerical values. | Explicitly state that different letters may have equal values. |
| Explaining all possible pairs could become an unnecessary gate. | Make multiple-pair discussion enrichment, not a prerequisite to two-step solving. |
| Repeated coefficient-two examples can encourage a surface template. | Add the optional fresh coefficient-three check `3x + 2 = 14`, when the arithmetic is comfortable. |

The author retained substitution of a known number relatively early to preserve the user's intended `x = 3; B = 2 + x` progression. A standalone two-step episode still precedes the full story. The original review proposed splitting notation/division and bars/substitution into additional numbered lessons; explicit two-phase teaching and pause points address that concern without making the lesson count rigid.

Final sequence: eleven core episodes plus an optional answer-detective extension. Early simple solving appears by episodes 3–4; capable learners need not wait through fixed-length introductory sessions. This is a review conclusion about the plan, not a claim that the children have yet demonstrated readiness or that the runnable course implements it.

## Implementation boundary

The outline is the teaching specification for the next content revision. The HTML application and packaged reader remain at their existing lesson count and behavior. No new classroom-effectiveness claim or mastery measure is implied by this review. A short pilot with each child should record where explanations, arithmetic or interface steps become difficult; those observations should guide subsequent course changes.
