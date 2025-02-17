# Task Directory Structure

This directory follows a standardized structure for managing tasks across the rolodexter4 ecosystem.

## Directory Organization

```
/tasks
  ├── active-tasks/       # Tasks currently being worked on
  ├── pending-tasks/      # Tasks waiting for approval or action
  ├── resolved-tasks/     # Completed and reviewed tasks
  ├── validation/         # Automated checks (if applicable)
  ├── archived/           # Long-term references (optional)
  └── README.md          # This file
```

## Folder Descriptions

### active-tasks/

- Contains tasks that are currently being worked on
- Tasks in this folder should have an assigned owner
- Regular updates expected in the discussion threads

### pending-tasks/

- Tasks awaiting review, approval, or further action
- May include tasks blocked by dependencies
- Requires clear documentation of what is being waited on

### resolved-tasks/

- Successfully completed and reviewed tasks
- Maintains discussion history for future reference
- Used for tracking completed work and patterns

### validation/

- Contains automated validation scripts and tools
- Includes task format checkers and linters
- Houses documentation for validation rules

### archived/

- Historical tasks that may be referenced but are no longer active
- Provides long-term storage for completed project phases
- Used for maintaining institutional knowledge

## Task File Format

All task files should:

1. Use the `.html` extension
2. Follow the standardized discussion thread format
3. Include proper metadata tags
4. Maintain clear status indicators
5. Keep discussion threads up-to-date

## Status Updates

Tasks move between folders based on their status:

- New tasks start in `pending-tasks/`
- When work begins, move to `active-tasks/`
- Upon completion, move to `resolved-tasks/`
- After project completion, may move to `archived/`

## Validation

All tasks are subject to automated validation checks to ensure:

- Proper HTML structure
- Required metadata presence
- Standardized discussion thread format
- Valid cross-task references

Last Updated: 2025-02-18 01:06:00 UTC
Updated By: rolodexterVS
