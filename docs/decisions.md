# Decisions

These are the choices that had the biggest effect on the implementation. They are not all choices I would keep forever, but each one helped me keep the project understandable and within the time available.

## 1. Keep authorization on the API

- **Chose:** Enforce recruiter, interviewer and application-level access through Express middleware.
- **Rejected:** Relying on hidden buttons and role-specific React routes as the permission system.
- **Why:** The browser is controlled by the user, so frontend restrictions are only a convenience. Every sensitive endpoint checks the authenticated user again. An interviewer cannot advance a candidate by manually sending a request, and can only read applications where a matching panel assignment exists.

## 2. Use an HTTP-only cookie for the session

- **Chose:** Sign a short user identity into a JWT and deliver it through an HTTP-only cookie.
- **Rejected:** Saving a bearer token in `localStorage`, and building a database-backed session store for this version.
- **Why:** An HTTP-only cookie is not directly readable by client-side JavaScript, which is a safer default if an XSS bug appears. A JWT also avoided introducing another collection and session cleanup process during a short project. The trade-off is more careful CORS and cookie configuration because the Vercel client and Render API use different domains.

## 3. Model pipeline changes as actions

- **Chose:** Separate `advance`, `reject` and `reinstate` endpoints backed by one pipeline service.
- **Rejected:** Letting the client PATCH `stage` to any requested value.
- **Why:** The valid transition is a business rule, not a UI detail. Named actions make it clear that Applied moves only to Screening, and that rejected candidates must return to the stage they left. Bulk actions reuse the same functions, so the single-candidate and bulk flows cannot quietly develop different rules.

## 4. Store current state and history separately

- **Chose:** Keep the current stage on `Application` and append every meaningful change to `ApplicationEvent`.
- **Rejected:** Rebuilding the current stage from the event stream on every query, or storing a mutable history array inside the application document.
- **Why:** Candidate lists and dashboard counts need the current stage often, so it should be cheap to query and index. A separate event collection can grow without making the application document increasingly large, and there are no routes for editing or deleting past events. Transactions keep the stage update and its history event together.

## 5. Represent interview panels with a join collection

- **Chose:** Use `PanelAssignment` with references to an application, an interviewer and the recruiter who assigned them.
- **Rejected:** Store an array of interviewer IDs directly on every application.
- **Why:** The relationship is many-to-many: one application can have several interviewers and one interviewer can work across many applications. A separate collection makes both directions easy to query, supports assignment metadata, and allows a compound unique index to prevent duplicate assignments.

## 6. Do candidate discovery on the server

- **Chose:** Send search, filter, sort and pagination options to one API endpoint and execute them through MongoDB.
- **Rejected:** Downloading every application and filtering it in React.
- **Why:** Client-side filtering would feel simple with the demo dataset but would return the wrong total once pagination was added and would expose records the viewer did not need. Server-side queries keep totals accurate, enforce interviewer visibility before returning data, and avoid transferring the whole pipeline for every search.

## 7. Derive stalled alerts from stage-entry time

- **Chose:** Calculate whether an application is stalled from `stageEnteredAt`, and store dismissals by both application and stage.
- **Rejected:** A permanent `isStalled` flag on the application, or a dismissal attached only to the candidate.
- **Why:** Stalled status changes with time, so storing a boolean would require a scheduled process to keep it correct. A stage-scoped dismissal meets the important requirement that an alert stays dismissed for the current stage but can return if the candidate advances and becomes stuck again.

## 8. Treat Hired as completed, not active

- **Chose initially:** Count every non-rejected application, including Hired, as active by reusing the existing active-stage constant.
- **Rejected initially:** Maintaining a dashboard-specific definition of active stages.
- **Why:** Reusing one constant was simpler and avoided two similar lists of stages.
- **Later reversed:** Testing the dashboard made it clear that the simpler definition produced a misleading headline: hiring is a completed outcome, not work still in progress. Active now means Applied, Screening, Interview and Offer. That correction initially made the Hired funnel row show zero, so I also separated the active headline filter from the stage-breakdown filter. Hired remains visible in the funnel without being added back to the active total.

## 9. Split the free deployment across Vercel and Render

- **Chose:** Host the static React build on Vercel, the long-running Express service on Render, and the data in MongoDB Atlas.
- **Rejected:** Reworking the API into Vercel serverless functions or putting every part on one virtual machine.
- **Why:** The split matched the existing client/server structure and allowed each part to use a suitable free service. It also kept deployment changes small. The downside is that production authentication depends on an exact CORS origin and cross-site cookie settings, which caused one deployment issue when the public Vercel domain changed.
