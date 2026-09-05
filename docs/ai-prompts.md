# AI prompts

I used Codex throughout the project as a pair programmer. I worked in small steps, checked each flow in the browser, and asked for focused fixes when something did not behave as expected. The prompts below are the significant ones, in roughly the order I used them. I have shortened a few repeated follow-ups, but kept the meaning of what I asked.

## Building the backend foundation

### Prompt

> Set up the React frontend, Express backend and MongoDB connection for the hiring pipeline. Implement the requirements step by step so I can understand what each flow does.

### What I got

The initial project structure, environment configuration and database connection, followed by error handling and Mongoose models for users, openings, applications, events, panels, interviews and alert dismissals.

### What I corrected

I kept the client and server as separate packages because that matched the planned Vercel and Render deployment. I also checked the model relationships and added indexes around the filters and date-based queries the application actually uses.

## Authentication and permissions

### Prompt

> Implement email and password authentication for recruiter and interviewer roles. Explain how credentials are created, how sessions work, and make sure permissions are enforced by the server.

### What I got

Password hashing with bcrypt, JWT authentication through an HTTP-only cookie, login/logout/current-user endpoints, protected routes and role middleware. Recruiters received full pipeline access, while interviewers were limited to assigned applications and feedback submission.

### What I corrected

I verified that restrictions were not only hidden in React. The API routes also reject interviewer attempts to create or edit openings, edit candidates or advance stages. For production deployment I changed the cookie settings to use `Secure` and `SameSite=None` in production so the Vercel frontend could authenticate with the Render API.

## Openings, applications and pipeline rules

### Prompt

> Build job opening and application CRUD, then add the Applied to Screening to Interview to Offer to Hired flow. Rejection should stop progress, and reinstating should return the candidate to the exact previous stage.

### What I got

Recruiter endpoints for openings and applications, archive/restore support, guarded stage transitions, rejection and reinstatement. Each change also creates a permanent application event.

### What I corrected

I tested invalid transitions through the API and kept stage changes as named actions instead of allowing arbitrary stage edits. This made skipping stages harder to do accidentally and kept the history consistent.

## Search, bulk actions and reporting

### Prompt

> Add server-side candidate search, filters, sorting and pagination. Add bulk advance, bulk reject and CSV export, with an individual result when one candidate cannot be changed.

### What I got

A MongoDB aggregation for the candidate list search, server-side pagination and sorting, per-application bulk results, and a downloadable CSV of applications for open positions.

### What I corrected

The opening filter did not work correctly at first, and typing in the source field caused it to lose focus after every character. I reported both while testing. The fix kept the filter controls mounted and sent stable query values to the API.

## Dashboard and stalled alerts

### Prompt

> Implement the recruiter dashboard with open positions, active applications, interviews this week, hires this month, pipeline breakdowns and a weekly trend. Add stalled-candidate alerts after ten days and allow a recruiter to dismiss them.

### What I got

Dashboard aggregations, the quarterly chart, opening and stage summaries, recent activity, stalled-candidate detection and stage-scoped dismissals.

### What I corrected

This area needed two important corrections. First, the dashboard originally treated `Hired` as active. I asked for that to be changed because hiring is a completed outcome, so the active count now includes only Applied, Screening, Interview and Offer.

That first correction exposed another issue: the pipeline overview reused the active-only filter, so it displayed zero under Hired even when “Hires this month” displayed one. I asked for this to be fixed without putting hired candidates back into the active total. The stage breakdown now includes Hired independently.

I also questioned why a hired candidate appeared as stalled. The stalled-stage list was corrected so completed and rejected applications cannot generate alerts, while an alert can still return if the same candidate advances and later stalls in a new stage.

## Connecting and testing the frontend

### Prompt

> Help me go through the candidate flow step by step and explain what was implemented at each point.

### What I got

Reusable layout components, login and protected navigation, recruiter dashboard, opening list and detail views, candidate list and detail pages, interviewer assignments, interviewer feedback, bulk actions and stalled alerts.

### What I corrected

While walking through the screens, opening the openings page caused React to try rendering an object containing `{ total, interviewing }`. I reported the browser error and changed the component to render the individual numeric properties.

The opening detail also contained an Activity tab without useful content. After reviewing what it showed, I chose to remove it rather than keep a misleading empty tab. Candidate history remains available on the candidate detail page, where it belongs.

I later asked for recruiter forms to create and edit applications and for interviewer assignment controls. After implementation, I tested both roles separately to confirm that recruiters manage the pipeline and interviewers only see their assignments and submit feedback.

## Seed data and automated tests

### Prompt

> Add more seed data so the website shows realistic information dynamically instead of me adding everything one by one.

### What I got

Repeatable seed scripts for demo users, openings, candidates across every stage, panel assignments, interviews and feedback. The data includes archived and closed openings, rejected candidates and candidates old enough to trigger stalled alerts.

### What I corrected

I asked that seeding be safe to run again without creating duplicate demo records. I also tested the seeded recruiter and interviewer accounts instead of relying only on empty-state screens.

### Prompt

> Look at the test folder. Is it important, or should I remove it?

### What I got

An explanation of what the tests protected, followed by focused frontend and backend tests for authorization, pipeline rules, reporting boundaries, search, bulk results and role-based navigation.

### What I corrected

I kept the useful tests and was careful about staging only the intended files during individual fixes. I ran the complete test suite again after the dashboard filtering correction.

## Production deployment

### Prompt

> Check the code for production readiness and guide me through deploying the frontend to Vercel, the API to Render and the database to MongoDB Atlas.

### What I got

Production environment guidance, secure cookie behavior, CORS configuration, a Vercel SPA rewrite, Render build/start settings and instructions for seeding the production database.

### What I corrected

The first Vercel link was protected by Vercel Authentication, so an outside reviewer saw Vercel's login page instead of Hireflow. I disabled deployment protection and used the public production domain.

The next login attempt failed because Render's `CLIENT_ORIGIN` still contained the earlier Vercel URL. I updated it to `https://hiring-pipeline-wheat.vercel.app` and redeployed. The Render logs then showed successful `200` responses for login, dashboard, jobs, applications and alerts.

## How I treated the AI output

I did not treat the first generated result as automatically correct. I reviewed the code, ran the flows manually, checked browser and deployment logs, and used the test suite after changes. Most of the useful improvements came from finding a concrete mismatch in the running application and then giving the AI a narrow bug report instead of asking it to rewrite a whole feature.
