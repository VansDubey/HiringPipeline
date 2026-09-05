# Submission

## Links

- **GitHub repository:** https://github.com/VansDubey/HiringPipeline
- **Live application:** https://hiring-pipeline-wheat.vercel.app

## Notes for the reviewer

The frontend is hosted on Vercel and the API is hosted on Render. The Render service uses a free instance, so the first request after a period of inactivity may take around a minute while it wakes up. Once it is running, the app should respond normally.

The database is already seeded with openings and candidates at different stages, including rejected, hired, and stalled applications. There are also panel assignments, scheduled interviews, and feedback entries so both roles have meaningful data to explore.

The recruiter account shows the complete hiring workspace. The interviewer account only shows assigned candidates and allows feedback to be submitted; the same restrictions are enforced by the API.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Recruiter | recruiter@hireflow.local | RecruiterDemo!2026 |
| Interviewer | interviewer@hireflow.local | InterviewerDemo!2026 |

## Stack

| Layer | What I used | Why |
|-------|-------------|-----|
| Frontend | React 19, React Router and Vite | A small component-based frontend was enough for the dashboard and role-specific workflows, while Vite kept local development and production builds straightforward. |
| Backend | Node.js, Express and Mongoose | Express made the API and authorization rules explicit, and Mongoose provided useful schemas, validation and indexes around the MongoDB data. |
| Database | MongoDB Atlas | The application data is document-oriented but still has clear references between users, openings, applications, panels, interviews and events. Atlas also provided a practical managed free tier. |
| Hosting | Vercel for the frontend and Render for the API | This keeps the static client separate from the long-running API and works within the free-tier requirement. |

## Goal checklist

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and roles | Done | Email/password login uses hashed passwords, JWTs in HTTP-only cookies, and server-side recruiter/interviewer authorization. |
| 2 | Job openings | Done | Recruiters can create, edit, archive and restore openings. Archived openings are hidden from the normal view without deleting their applications. |
| 3 | Applications inside openings | Done | Applications belong to one opening and can be created, viewed and edited by recruiters. Each opening has its own pipeline view. |
| 4 | Pipeline rules | Done | Candidates advance one stage at a time, can be rejected from any active stage, and return to their previous stage when reinstated. Invalid transitions are rejected by the API. |
| 5 | Interview panel | Done | Recruiters can assign or remove interviewers. Interviewers see only their assigned candidates and can leave feedback without changing stages. |
| 6 | Finding candidates | Done | Search, opening/stage/source filters, sorting and pagination are handled on the server and include a total match count. |
| 7 | Bulk actions and CSV export | Done | Recruiters can bulk-advance or bulk-reject applications with a result for each candidate, and export the open pipeline as CSV. |
| 8 | Dashboard | Done | The dashboard reports open positions, active applications, this week's interviews, this month's hires, stage/opening breakdowns and a 13-week application trend. |
| 9 | Permanent history | Done | Creation, transitions, rejection, reinstatement, panel activity and interviewer feedback are recorded in an append-only application timeline. |
| 10 | Stalled alerts | Done | Applications stalled for at least ten days appear with a navigation badge. Dismissals are tied to the application and stage, allowing an alert to return after a later stage stalls. |

## How much time did you actually spend?

About 12 hours across two main working sessions. I built the backend rules and data model first, then connected the frontend one flow at a time. The last part of the work was spent testing both roles, fixing issues found while walking through the app, adding realistic seed data, and deploying it.

## What would you do next, with another 12 hours?

I would add a small public careers and application flow so candidates can apply directly instead of every application being entered by a recruiter. I would also add account management for an administrator, improve mobile layouts, and expand the integration tests around login cookies, permissions and complete recruiter/interviewer journeys.

I would spend the remaining time improving operational details: structured interview scorecards, clearer loading and retry states, production monitoring, and a more scalable dashboard aggregation strategy.

## What are you least happy with in this codebase, and why?

The opening list currently requests application counts separately for each opening. It is easy to understand and works well for the seeded dataset, but it would create unnecessary API and database work as the number of openings grows. I would replace it with one summary endpoint that calculates all counts in a single aggregation.

I also would not consider manual recruiter entry the final candidate intake experience. It satisfies the internal application-management requirement, but a real hiring product should connect to a careers page, referral form or ATS import so applications arrive automatically.
