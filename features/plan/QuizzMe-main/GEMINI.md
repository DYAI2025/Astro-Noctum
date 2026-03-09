# Gemini Project Analysis: Personality & Horoscope Platform

## Project Overview

This is a Next.js project that serves a multi-domain platform for personality quizzes and horoscopes. The codebase is structured to support two distinct "verticals": a quiz vertical and a horoscope vertical. A key architectural feature is the use of Next.js middleware (`src/middleware.ts`) to route users to the correct vertical based on the request's hostname.

The project is built with React, TypeScript, and Tailwind CSS. The quizzes are self-contained components that manage their own state and data, as seen in `src/components/quizzes/LoveLanguagesQuiz.tsx`. The project is configured for static site generation (`output: 'export'`), which is ideal for deploying to static hosting platforms like GitHub Pages.

## Building and Running

### Development

To run the development server:

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Build

To create a production-ready build:

```bash
npm run build
```

This will generate a static build in the `out/` directory.

### Linting

To check the code for style and errors:

```bash
npm run lint
```

## Development Conventions

*   **Component-Based Architecture:** The application is built with React components.
*   **"Fat Components":** The quiz components appear to be "fat components," meaning they contain their own data, logic, and rendering. This is a common pattern in smaller to medium-sized applications.
*   **Styling:** The project uses Tailwind CSS for styling, with utility-first classes.
*   **Routing:** Routing is handled by a combination of Next.js file-based routing and custom middleware for multi-domain support.
*   **State Management:** Component-level state is managed with React Hooks (`useState`).
*   **TypeScript:** The project uses TypeScript for static typing.
