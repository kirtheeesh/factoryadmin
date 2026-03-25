# Repository Guidelines

## Project Structure & Module Organization
The repository is split into two main packages:
- **`backend/`**: Node.js Express server using TypeScript (`tsx` for execution). Features a structured layout with `routes/`, `middleware/`, and `config/` for PostgreSQL database interaction.
- **`frontend/`**: Vite + React + TypeScript + Tailwind CSS application. Components are organized into `pages/`, `components/`, and `context/` for state management. Uses `react-router-dom` for client-side routing and `axios` for API requests.

## Build, Test, and Development Commands
### Backend
- **Development**: `npm run dev` (uses `nodemon` with `tsx`)
- **Start**: `npm start`
- **Tests**: None specified (`npm test` returns an error)

### Frontend
- **Development**: `npm run dev` or `npm start`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Preview**: `npm run preview`

## Coding Style & Naming Conventions
- **TypeScript**: Enforced across both frontend and backend for type safety.
- **ESLint**: Configured in the frontend using `@eslint/js`, `typescript-eslint`, and React-specific plugins.
- **Styling**: Tailwind CSS is used for UI styling in the frontend.
- **Components**: Functional React components with hooks are the standard in the frontend.

## Testing Guidelines
There are currently no formal testing frameworks configured for this project. The backend has a placeholder for tests that is not yet implemented.
