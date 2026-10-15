TOPIC: xxx

Create or substantially improve an engaging, technically accurate interactive lesson about this topic in **`jeffadickson/but-does-it-do-anything`**.

Act as a subject-matter expert, educator, instructional designer, and implementation lead. Adapt your approach to the topic: it may involve programming, software tools, engineering, mathematics, scientific concepts, practical procedures, or nontechnical subjects.

Develop the outline iteratively before building. Then implement, review, verify, document, and integrate the finished lesson. Do not stop at a proposal.

## 1. Establish the audience and purpose

Identify:

- The intended audience and assumed background.
- What learners should understand or be able to do afterward.
- The practical problem or motivating question.
- Common misconceptions and likely difficulties.
- The prerequisites, tools, and materials actually needed.
- The appropriate scope and depth.

Use the request and repository context to make reasonable assumptions. State consequential assumptions briefly. Ask questions only when missing information would materially change the lesson; otherwise proceed.

Prioritize understanding and application over memorizing terminology.

## 2. Inspect the repository and track the work

Read the repository’s README, contribution instructions, reusable lesson prompt, applicable `AGENTS.md` files, and relevant existing lessons.

Follow the repository’s actual directory, metadata, catalog, build, test, and publishing conventions. Reuse established infrastructure.

Use **GitHub issues and task checklists** to monitor progress:

- Create or update an issue for the lesson.
- Track outline development, content, media, interactions, verification, reviews, and delivery.
- Record substantial findings and unfinished work as actionable tasks.
- Update task status as work progresses.
- Link relevant issues in commits and pull requests.
- Distinguish completed work, proposed work, and blocked work.

If GitHub access is unavailable, maintain the same task list in a repository file and report that limitation. Do not claim external issues were created when they were not.

## 3. Develop and iterate the outline first

Do not begin by generating a large finished lesson from the initial topic alone.

Create an outline containing:

- Learning objectives.
- A motivating example or situation.
- The sequence of concepts and activities.
- Prerequisites for each major section.
- Planned examples, demonstrations, screenshots, and exercises.
- Likely misconceptions.
- Assessment questions.
- The intended conclusion and further investigations.

Perform at least three outline passes:

1. **Subject-matter pass:** Check accuracy, scope, missing fundamentals, and prerequisites.
2. **Learner pass:** Check pacing, terminology, likely questions, and whether each section prepares the learner for the next.
3. **Instructional-design pass:** Improve examples, activities, visual explanations, and assessment alignment.

Revise between passes and record the important changes. Use an independent reviewer agent when available, identifying AI review honestly.

Present a concise outline summary, then proceed with implementation unless the user explicitly requested an outline approval checkpoint.

The outline should guide the work without preventing improvements discovered during implementation.

## 4. Build a coherent learning progression

Organize the lesson around connected ideas rather than disconnected facts or demonstrations.

Where appropriate:

1. Establish a recognizable problem or question.
2. Explain the necessary fundamentals.
3. Show a straightforward approach.
4. Introduce a complication or deeper question.
5. Develop a more capable approach.
6. Let the learner apply or investigate it.
7. Explain tradeoffs and limits.
8. Revisit the original problem with the new understanding.

Adapt this structure to the subject. A historical lesson, practical procedure, mathematical argument, and programming tutorial need different forms of evidence.

Use a recurring example when it improves continuity. Do not force every topic into a software or instrument-control analogy.

## 5. Answer practical learner questions

Identify the questions someone new to the subject would naturally ask.

Depending on the topic, these may include:

- What is this, and why does it exist?
- When would I use it?
- What must I know or prepare first?
- What actually happens when I take this action?
- What changes, and what remains unchanged?
- How can I tell whether it worked?
- What happens if I omit a step or make a mistake?
- Can I undo, repeat, share, or combine it?
- What are the limits and alternatives?
- What risks or failure modes matter in practice?
- How would I verify the result?

For software abstractions, also address storage, copying, ownership, execution, completion, and failure when relevant.

Do not assume that a correct example automatically answers these questions.

## 6. Choose the right teaching medium

Select media according to what helps the learner understand:

| Medium | Appropriate use |
|---|---|
| Explanatory prose | Motivation, reasoning, interpretation, and nuance |
| Worked example | Demonstrating a complete process or argument |
| Static screenshot | Showing an interface, command result, configuration, or observable state |
| Annotated image | Directing attention to important details |
| Diagram | Explaining structure, relationships, dependencies, or flow |
| Animation | Showing changes over time when timing or sequence matters |
| Interactive simulation | Exploring consequences of changing inputs or assumptions |
| Real executable example | Demonstrating actual language, tool, or system behavior |
| Exercise | Requiring the learner to predict, decide, explain, or perform |

Interactivity must earn its place. A clear screenshot or diagram may teach more effectively than an elaborate simulation.

For screenshots:

- Capture actual interfaces or outputs where possible.
- Identify the application and relevant version.
- Crop and annotate for clarity.
- Provide captions and meaningful alternative text.
- Remove credentials, personal information, and unrelated content.
- Explain what the learner should notice.
- Label illustrative mockups as mockups.
- Do not use screenshots of code as the only copyable source.

## 7. Use real execution where appropriate

Reuse existing repository runners and demonstration infrastructure when suitable.

For C# examples, use the established Roslyn/.NET WebAssembly runner where practical. For other languages or tools, select a suitable supported execution method.

- Execute the exact source displayed to the learner.
- Provide formatted, syntax-highlighted, copyable code.
- Use a clearly labeled **Code** button where appropriate.
- Preserve edited examples when switching demonstrations.
- Handle compiler errors, runtime failures, reset, and stop behavior clearly.
- Document runtime and platform restrictions.

When actual execution is impractical, use complete source examples, captured output, screenshots, or explicitly labeled simulations.

Clearly distinguish:

- Actual execution.
- Simulation.
- Recorded execution.
- Illustrative content.
- Instructions that must be performed outside the lesson.

Do not imply that a browser demonstration executes a language, contacts hardware, or uses an external service when it does not.

## 8. Make behavior and outcomes observable

For demonstrations and procedures, show the relevant starting state, action, and resulting state.

Use appropriate indicators such as:

- Progress, elapsed time, or a countdown.
- Before-and-after comparisons.
- Inputs, outputs, and units.
- State transitions.
- Logs or intermediate calculations.
- Success criteria and failure explanations.

Explain what a model includes and omits. Configuration controls must affect the behavior they claim to control.

Distinguish observation from interpretation, and measured results from predictions.

## 9. Include meaningful practice

Include exercises throughout the lesson, with at least six substantive exercises for a full-length lesson. Adjust the number for a deliberately shorter scope and explain the choice.

Use a variety of tasks:

- Predict an outcome.
- Identify a misconception.
- Interpret a screenshot, diagram, or result.
- Put steps in order.
- Diagnose and correct an error.
- Compare alternatives.
- Complete a practical task.
- Apply the concept to a new situation.

Provide immediate feedback where the answer can be assessed automatically. For open-ended tasks, provide evaluation criteria, a worked example, or a reference answer.

Explain why an answer works, not merely whether it is correct. Map exercises to the learning objectives.

## 10. Research and explain tradeoffs accurately

Use authoritative sources appropriate to the topic: official documentation, primary research, standards, original records, or established references.

Verify changing facts, version-specific behavior, dates, and preview versus stable status. Record the date of verification.

Compare alternatives fairly. Do not make a simpler or older approach artificially poor to justify a more sophisticated one.

Discuss limitations in the context of the actual use case. Avoid unsupported universal claims about performance, reliability, effectiveness, or superiority.

Separate established facts, simplifying assumptions, estimates, and your own interpretations.

## 11. Design the lesson as a polished publication

Provide:

- A clear title and subtitle.
- **An original three-line haiku based on the topic near the top of the lesson.** Aim for a natural 5–7–5 syllable structure without sacrificing clarity. Keep it distinct from the factual introduction.
- A visible lesson version.
- Learning objectives and prerequisites.
- Clear chapter navigation.
- Readable typography and restrained colors.
- Responsive desktop and mobile layouts.
- Accessible controls, labels, focus states, and alternative text.
- Reduced-motion support.
- Light and dark modes where practical.
- A progress indicator appropriate to the lesson.
- A glossary or quick reference where useful.
- Sources and further investigations.

Conclude by revisiting the central question and suggesting a short, motivated set of next steps. Explain what each next investigation would help the reader understand.

## 12. Version the lesson and preserve its history

Use a consistent version such as **`1.0.0`**.

- Major: substantial restructuring or changed learning scope.
- Minor: meaningful new content or capabilities.
- Patch: corrections and small improvements.

Use a prerelease version such as `0.1.0` while the lesson is incomplete.

Keep the displayed version, metadata, README, and downloadable package consistent. Prefer one authoritative version field used by the build.

Record the update date and maintain a concise changelog. Identify the source commit in packaged artifacts where practical. Distinguish the lesson version from versions of the tools it teaches.

## 13. Implement and verify the deliverables

Create the files appropriate to the repository, normally including:

- `lesson.json`
- `app/index.html`
- Supporting assets under `app/`
- `README.md`
- Outline and review records
- A changelog
- Companion examples when applicable
- Tests or verification scripts when applicable

Make the reading experience work offline where practical. Bundle necessary permitted assets. If execution needs a local server, external service, SDK, or account, explain that clearly and provide the simplest supported setup.

Choose verification appropriate to the subject:

- Compile and run code examples.
- Reproduce practical procedures.
- Check calculations and worked solutions.
- Verify factual claims against sources.
- Test interactive controls and exercise feedback.
- Check links, downloads, navigation, accessibility, and mobile layouts.
- Inspect screenshots and diagrams for accuracy and readability.
- Test offline behavior when claimed.

Record what was actually checked, on which platforms, and what remains unverified. Never fabricate test results or evidence.

## 14. Review the completed lesson in five passes

After implementation, perform five distinct review-and-revision passes:

1. **Subject accuracy:** Facts, terminology, examples, sources, and assumptions.
2. **Teaching completeness:** Prerequisites, pacing, practical questions, and learning objectives.
3. **Application and mistakes:** Exercises, common errors, failure cases, recovery, and limitations.
4. **Presentation and usability:** Media choices, accessibility, navigation, readability, and working interactions.
5. **Reproducibility and integration:** Files, versions, setup instructions, verification, catalog registration, and delivery.

Fix findings between passes. Use an independent reviewer when available and describe the review accurately.

Maintain a traceable checklist connecting objectives and user requirements to lesson sections, activities, and verification evidence.

## 15. Integrate and deliver

Use the repository’s existing catalog and publishing workflow. Do not manually edit generated indexes or introduce a competing deployment system.

For development tooling, provide appropriate setup, build, test, preview, and clean commands. Avoid unnecessary dependencies for lessons that do not need them.

Commit the completed work, push the branch, and create or update the pull request. Inspect CI and fix failures introduced by the change. Do not merge or publish unless authorized.

Update GitHub tasks to reflect the actual state. Create issues for substantial unfinished work rather than presenting it as complete.

Finish with a concise report containing:

- What the lesson teaches and what changed.
- Its version.
- How to open or run it.
- Verification actually completed.
- Material limitations and outstanding tasks.
- Commit and pull-request links.
- Download links where applicable.
- Whether it is local, pushed, merged, or confirmed published.

**Acceptance criterion:** The learner can explain the subject, apply it appropriately, recognize common mistakes, and evaluate the result. The lesson’s media, interactions, and examples must support those outcomes.
