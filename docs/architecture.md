# Architecture

## The short version

Hireflow is a small three-part web application: a React client, an Express API, and a MongoDB database. The browser never connects to MongoDB directly. It talks to the API over HTTPS, and the API is responsible for validation, permissions, pipeline rules and database access.

I kept the client and server separate because they have different jobs and are deployed independently. The frontend handles presentation and local UI state. The server owns all decisions that must remain trustworthy, especially who can see an application and who is allowed to change it.

## Moving pieces

### React client

The client is a Vite-built React application using React Router. Each main workflow has its own page: dashboard, openings, candidates, candidate details, interviewer assignments and stalled alerts. Shared pieces such as the page header, status indicator, empty state and application form are components rather than being copied into every page.

`SessionContext` checks `/api/auth/me` when the application starts and keeps the signed-in user available to the rest of the UI. `ProtectedRoute` prevents anonymous access, while the sidebar and route components show the appropriate workspace for the user's role. These frontend checks improve the experience, but they are not treated as security controls.

All API calls go through a small fetch wrapper. It adds JSON headers, includes the authentication cookie and turns unsuccessful responses into useful errors for the page to display. Search, filtering, sorting and pagination values are sent as query parameters instead of filtering a full dataset in the browser.

### Express API

The server is organised into a few straightforward layers:

- Routes describe the HTTP endpoints and attach authentication and role middleware.
- Controllers translate HTTP input into service calls and format the response.
- Services contain the real business rules, queries and transactions.
- Mongoose models define stored fields, relationships, validation and indexes.

The API has separate routes for authentication, openings, applications, the dashboard and stalled alerts. Application routes also cover pipeline actions, bulk actions, CSV export, panel membership, feedback and the permanent timeline.

Authentication uses a signed JWT stored in an HTTP-only cookie. The authentication middleware verifies the token and loads the user. Recruiter-only actions then pass through role middleware. For application-specific interviewer access, another middleware checks `PanelAssignment` before returning candidate details or a timeline. This matters because hiding recruiter buttons in React would not stop somebody from calling the endpoint directly.

Pipeline changes are actions such as `advance`, `reject` and `reinstate`, not a general “set stage” endpoint. The service works out the only valid next stage and rejects illegal changes. Advancing or rejecting an application and writing its history event happen inside the same MongoDB transaction, so one cannot succeed without the other. Panel assignment changes use the same approach.

### MongoDB

MongoDB stores seven main kinds of records:

- `User` stores recruiter and interviewer identities and password hashes.
- `JobOpening` stores the role, department, description and lifecycle status.
- `Application` stores a candidate's application to one opening and its current state.
- `PanelAssignment` represents the many-to-many relationship between applications and interviewers.
- `Interview` stores scheduled interview occurrences used by dashboard reporting.
- `ApplicationEvent` is the append-only history of creation, stage changes, rejection, reinstatement, panel activity and feedback.
- `AlertDismissal` records that a recruiter dismissed a stalled alert for one application at one particular stage.

The application document contains the current stage because nearly every list needs it quickly. The event collection keeps the historical record separately. This is intentional duplication: the current view remains easy to query, while the timeline still explains how it got there.

## Where it runs

The production frontend is built and served by Vercel at `https://hiring-pipeline-wheat.vercel.app`. Vercel's rewrite sends browser routes such as `/login` or `/candidates/:id` to `index.html`, allowing React Router to take over after a refresh.

The Node/Express API runs as a Render web service at `https://hiringpipeline.onrender.com`. Render provides the port at runtime and performs health checks against `/api/health`. The free service may sleep when unused, which is why the first request can be slower.

The database runs in MongoDB Atlas. Render receives the Atlas connection string, JWT secret, production mode and allowed client origin through environment variables. None of those values are built into the frontend bundle or committed to Git.

The browser and API are on different domains, so the server allows the exact Vercel production origin through CORS and permits credentialed requests. In production the authentication cookie is HTTP-only, secure and `SameSite=None`, allowing it to accompany HTTPS requests from the Vercel client to Render.

## One request from beginning to end

Advancing a candidate is a useful example because it crosses every important boundary.

1. A recruiter opens a candidate and clicks **Advance stage**.
2. React sends `POST /api/applications/:id/advance` to the Render API with the session cookie included.
3. CORS checks that the request came from the configured Vercel origin.
4. The authentication middleware verifies the JWT and loads the user. The recruiter middleware rejects the request unless that user has the recruiter role.
5. The controller passes the application ID and recruiter ID to the pipeline service.
6. The service loads the application inside a MongoDB transaction and calculates the next legal stage. For example, Screening can become Interview, but it cannot jump directly to Offer. Rejected candidates must be reinstated before advancing, and Hired candidates cannot advance further.
7. In the same transaction, MongoDB updates the application's stage and `stageEnteredAt`, then inserts an `ApplicationEvent` containing the old stage, new stage and person responsible.
8. The API returns the updated application. React reloads the candidate data and timeline, so the new stage and its history entry appear together.

Bulk actions reuse the same single-application rules. They process every selected ID independently and return both successes and refusals, rather than allowing one invalid candidate to hide the outcome for the rest.

## Reporting and stalled alerts

Dashboard values are calculated on the server from the current database state. Active applications deliberately include Applied, Screening, Interview and Offer, but not Hired or Rejected. The stage breakdown can still show Hired as a completed outcome, and the monthly hire figure is calculated using the current calendar-month boundary.

Stalled status is also derived rather than stored as a permanent boolean. An active application becomes stalled when its `stageEnteredAt` is at least ten days old. A dismissal is stored against both the application and its current stage. When the candidate moves forward, the old dismissal no longer matches, so a new alert can appear if the candidate later stalls again.

## What I deliberately left out

I did not build a public careers page or candidate self-application form. The required scope starts with recruiters managing applications, and I chose to complete the role permissions, pipeline history, bulk operations and reporting first. In a real product, public applications or an ATS import would be the next important addition because manual entry does not scale.

There is no admin screen for creating users. Demo users are created with an idempotent seed script, while production credentials and secrets remain outside the repository. A fuller product would need invitations, password resets, account disabling and probably an administrator role.

I also left out resume uploads, email notifications, calendar-provider integration, real-time updates and background jobs. Those features would introduce file storage, third-party services, queues and retry behaviour. They are valuable, but none was necessary to demonstrate the ten requested flows within the time budget.

Finally, I kept the deployment as two services instead of adding a gateway or hosting everything under one domain. That made the free deployment simple, although it means cookie and CORS configuration must be handled carefully. At a larger scale I would also replace the opening page's per-opening count requests with one aggregated summary endpoint.
