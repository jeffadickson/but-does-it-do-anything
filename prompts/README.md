# Reusable prompts

Versioned starting points for creating and maintaining this repository's lessons.
These are instructions to copy into a development conversation, not scripts or
published lessons. They do not require a build or catalog entry.

| Prompt | Version | Purpose |
|---|---|---|
| [generic](generic.md) | 1.0.0 | Create a lesson on any topic, from software tools and Git to engineering and nontechnical subjects. |

## Use generic

1. Open [generic.md](generic.md) and copy the complete text.
2. Replace the first line, `TOPIC: xxx`, with your subject.
3. Add any audience, scope, or practical constraints after that line.
4. Use the prompt in a conversation with access to this repository.

The prompt includes three outline iterations, five finished-lesson review passes,
GitHub task tracking, topic-appropriate screenshots and interactions, real code
runners where useful, lesson versioning, and a topic haiku.

For importing an already-built lesson, use the existing
[lesson import prompt](../docs/IMPORT_PROMPT.md). Both prompts follow
[CONTRIBUTING.md](../CONTRIBUTING.md) and the actual repository infrastructure.

## Maintain this collection

Keep prompts in Markdown with descriptive lowercase filenames. Keep editable
fields at the top. Document each prompt's version here and record changes in
[CHANGELOG.md](CHANGELOG.md). The prompt version is separate from the version of
any lesson it generates.
