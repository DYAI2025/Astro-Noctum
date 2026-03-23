# CON-german-ui: German-Language User Interface

**Category**: Business

**Status**: Active

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

All user-facing text (labels, tooltips, onboarding copy, error messages, AI-generated interpretations) must be in German. Code identifiers, comments, commit messages, and internal documentation remain in English.

## Rationale

The target audience is German-speaking. The product's spiritual and psychological language (Jungian individuation, process language, Wu-Xing terminology) requires native-language precision to avoid misinterpretation. English code conventions are maintained for developer accessibility and industry standards.

## Impact

- All UI string literals and i18n resources must be authored in German
- AI interpretation prompts must instruct the model to respond in German
- Component names, variable names, and API endpoints remain in English
- Future internationalization would require extracting hardcoded German strings into a localization layer
