# Plan

## How I approached the work

I treated the ten requirements as one connected workflow rather than ten unrelated pages. My rough plan was to spend about 12 hours in five blocks:

1. Set up the client, API and database, then establish authentication and roles.
2. Build the core recruiting domain: openings, applications, pipeline rules, history and interviewer panels.
3. Add the larger queries and reporting work: candidate discovery, bulk actions, export, dashboard and alerts.
4. Build the React screens on top of those APIs and walk through both roles.
5. Use the remaining time for realistic seed data, tests, bug fixes, deployment and documentation.

The work ended up happening in two main build sessions, followed by a shorter deployment and documentation pass. I committed after each meaningful piece so the repository history shows the order in which the system took shape.

## Session 1: foundation and rules

I started with the project structure, environment handling, MongoDB connection and shared API error handling. Once the application could start cleanly, I created the Mongoose models and their relationships.

Authentication came next because every later query depends on who is asking. I implemented password hashing, login cookies and current-user lookup, then added server-side recruiter and interviewer middleware before building feature routes. This let me test permissions as each feature was added instead of trying to add security at the end.

After that I built the main domain in dependency order:

- Opening and application CRUD
- One-step stage advancement
- Rejection and exact-stage reinstatement
- Permanent application events
- Interview panel assignments and interviewer feedback

I deliberately finished these rules before spending much time on the UI. The pipeline is the part most likely to create damaged or inconsistent data if it is only enforced in React.

## Session 2: queries, reporting and interface

With the core actions working, I added server-side search, filters, sorting and pagination. Bulk advance and reject reused the existing single-application services, and CSV export used a separate reporting query.

I then implemented the dashboard and stalled-candidate logic. The dashboard needed calendar boundaries for weekly interviews, monthly hires and the 13-week trend. Stalled alerts were based on stage-entry time, with dismissals scoped to both application and stage.

Only after those endpoints were available did I connect the main React flows:

- Session-aware login and protected navigation
- Recruiter dashboard
- Opening list and opening pipeline
- Candidate list, filters and bulk controls
- Candidate details, editing and permanent activity
- Interviewer assignment
- Interviewer's assigned-candidate list and feedback
- Stalled-candidate alerts

I used reusable components for repeated layout and status patterns, but avoided introducing a larger state-management or component library. The application was small enough for page state, context and a shared API helper.

## Testing and correction pass

I walked through the site as a recruiter first, then signed in as an interviewer and repeated the flows with the narrower permissions. This exposed issues that were not obvious from reading the code:

- The opening filter behaved incorrectly.
- Typing into the source filter caused the field to lose focus after each character.
- The openings page tried to render a counts object as a React child.
- Hired applications were incorrectly included in the active count.
- Fixing that count accidentally removed Hired from the funnel breakdown.
- A completed candidate could appear in stalled alerts.
- The opening detail had an Activity tab without useful content, so I removed it.

I fixed these one at a time and kept the changes in focused commits. I also added demo data across different stages, opening statuses and dates so the dashboard, stalled alerts, interviewer panels and history could be tested without entering everything manually.

The automated tests focus on the rules with the highest cost if they regress: authentication and authorization, panel access, stage transitions, partial bulk results, server-side search, reporting boundaries and role-specific navigation.

## Estimate versus actual time

My initial estimate was:

| Area | Estimate |
|------|----------|
| Setup, schema and authentication | 2 hours |
| Core API and business rules | 3 hours |
| React interface | 3 hours |
| Reporting, tests and seed data | 2 hours |
| Deployment and documentation | 2 hours |
| **Total** | **12 hours** |

I spent roughly 12 hours overall, although I did not track every minute. The backend foundation was close to the estimate. The first frontend pass was faster than expected, but manual testing and deployment took longer. Most of that extra time went into small integration bugs, cross-domain cookies, matching Render's CORS origin to the final Vercel domain, and checking the experience with both roles.

The time was worth spending there: a feature existing in code is not useful if the reviewer cannot sign in or an input loses focus while being used.

## What I cut or simplified

I completed the ten required goals, so the cuts were mostly around stretch features and production depth.

The largest omission is public candidate intake. Applications are created by recruiters; there is no careers page or candidate application form. I also left out administrator-managed user invitations, password reset, resume uploads, email notifications, calendar integration and structured scorecards.

I kept deployment deliberately simple: one Vercel client, one Render API and MongoDB Atlas. I did not add a background worker, cache, event queue or monitoring platform. The current opening list also fetches counts per opening rather than using one optimized summary endpoint. That is acceptable for the demo dataset, but it is the first query pattern I would change for a larger installation.

Finally, the tests cover important services and UI behaviour but are not a complete browser-level end-to-end suite. Given more time, I would automate the full recruiter and interviewer journeys against a temporary database and add deployment smoke tests.
