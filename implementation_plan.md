# Vidzel - Implementation Plan

## Project Goal
Build a concept-stage SaaS platform for structured, long-term collaboration between NGOs, students, volunteers, and mentors.
**Key Focus**: Reducing volunteer churn, replacing fragmented tools, and supporting sustained engagement.

## Tech Stack
- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Vanilla CSS (CSS Modules for components, global CSS for variables/reset)
- State Management: React Context (for Role-Based Access Control MVP)

## Phase 1: Foundation & Setup
- [ ] Initialize Next.js project with TypeScript and Vanilla CSS.
- [ ] Setup Global CSS with CSS Variables for the "Premium/Calm" aesthetic (colors, typography).
- [ ] Configure fonts (Inter/Outfit).
- [ ] Create basic Layout components (Header, Sidebar/Navigation).

## Phase 2: Role-Based Access Control (RBAC) System
- [ ] Implement `AuthContext` to manage "mock" user sessions.
- [ ] Create a "Role Switcher" verification tool to easily swap between NGO, Student, Volunteer, Mentor during demos.
- [ ] Define permissions/routes per role.

## Phase 3: Core Features (MVP)
### 1. NGO Dashboard & Project Management
- [ ] Dashboard: Overview of active projects and pending applications.
- [ ] Create Project Flow: Form to define purpose, timeline, and structured collaboration needs.
- [ ] Project Management View: See participants, post updates.

### 2. Participant Experience (Student/Volunteer/Mentor)
- [ ] Dashboard: "My Projects" and "Recommended Opportunities".
- [ ] Project View: Details, "Join" flow (onboarding/application).
- [ ] Participation History: Visual timeline of engagement.

### 3. Collaboration Spaces
- [ ] Project Workspace: A shared view for accepted participants.
- [ ] Discussion Board / Communication Feed (Direct, not social-media style).
- [ ] Resources/Documents list (placeholder).

## Phase 4: Polish & Refinement
- [ ] Ensure "Calm, Professional" design language is consistent.
- [ ] Add micro-interactions (hover states, transitions).
- [ ] Verify no "excluded" features are present (no fundraising, no AI matching, etc).
