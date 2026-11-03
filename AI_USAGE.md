# AI Usage

This disclosure records AI assistance in the current implementation work only. It does not claim to describe any use by other contributors outside this work session.

## Tool

GitHub Copilot in Visual Studio Code assisted with repository scaffolding, backend and frontend implementation, requirements review, and fixes requested during the project. The assistant used workspace file inspection/editing, npm install/test/build commands, and the integrated browser to check the running local app. The application itself does not call an AI model or AI service.

## Prompt topics

The user-provided requests that guided the work covered:

- Planning and scaffolding a React/Vite and Express/TypeScript npm-workspaces application.
- Implementing the backend Fake Store product provider, catalogue routes, validation, and tests.
- Implementing the React catalogue views, backend-only data access, responsive layout, and tests.
- Reviewing the implementation against the take-home assessment.
- Hardening the image proxy, adding provider tests and category-navigation retry behavior, and documenting the project while leaving enquiry/email work for a later phase.
- Implementing the enquiry flow with client/server validation, an injectable local/SMTP email-provider design, success-only confirmation, tests, and documentation updates.

## Actual time spent on the assessment 

Approximately 1.5-2 hours actively prompting AI tools, reviewing generated code, debugging, and validating AI-assisted changes.

## Specific AI-generated mistakes and actions taken

UI responsiveness: Initial implementation had product images overflowing their frames, inconsistent product-card heights, and category links clipping on narrow screens. I reviewed the UI at desktop, tablet, and mobile widths and asked AI to correct the CSS. I then rechecked the layouts.

Enquiry confirmation layout: The initial success message had an awkward close-button position and excessive vertical spacing. I identified the issue during visual review and asked AI to improve the alignment and spacing. I verified the updated confirmation panel.

Testing and verification: An initial frontend test failed during enquiry-flow implementation. I reviewed the failure with AI, requested a correction, and reran the tests to verify the result.

## Verification and limitations

The implementation was checked with the project test, typecheck, and production-build scripts and a local browser smoke check. Provider tests use mocks; no SMTP credentials were supplied or used during implementation. AI-generated changes should still be reviewed by maintainers. No secrets or provider credentials were added to these documents. Contributors should update this file if they use additional AI tools or prompts.