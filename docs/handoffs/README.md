# Handoffs

A handoff lets a task continue in a new agent session without losing context. Active handoffs live in this folder, one file per unfinished task.

## When to write one

Whenever a task is not completely done at the end of a session (or before the context is lost), write or update a handoff. If the task is finished, do not write one.

## Lifecycle

1. **Start of a session:** list `docs/handoffs/`. If a handoff relates to the task at hand, read it (only that file) and continue from its "Next steps".
2. **During the work:** keep the handoff accurate. Check off finished steps and update the state.
3. **End of the session, task unfinished:** update the handoff so the next agent can resume without asking questions. Commit it with the work.
4. **Task done:** delete the handoff file (`git rm`) in the same commit that completes the task. Move anything still worth knowing into the relevant doc in `docs/`. Handoffs are temporary and never serve as documentation.

A handoff that is still here means the task is not done.

## File naming

`docs/handoffs/<task-slug>.md`, in kebab-case (e.g. `hero-visual.md`). One task per file. A large task can be split into one file per independent subtask.

## Structure

Use this template. Keep it short and factual.

```md
# Handoff: <task title>

Last updated: YYYY-MM-DD

## Goal
What the task is and what "done" means.

## State
What is done, what is in progress, which branch, and whether work is committed and pushed.

## Next steps
- [ ] Ordered, concrete actions the next agent should take.

## Decisions and constraints
Choices already made with the user, and things not to redo or change.

## Open questions
Anything that needs the user's input.

## Pointers
Relevant files and docs to read first.
```
