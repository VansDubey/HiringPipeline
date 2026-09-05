# Schema

Hireflow uses MongoDB through Mongoose. MongoDB calls these collections and documents rather than tables and rows, but I use “record” below where the distinction is not important. Every model receives an ObjectId `_id` automatically.

## User

One record represents somebody who can sign in.

| Field | Type | Notes |
|-------|------|-------|
| `name` | String | Required, trimmed, maximum 120 characters |
| `email` | String | Required, lowercased, trimmed and unique |
| `passwordHash` | String | Required and excluded from normal query results |
| `role` | String enum | Either `recruiter` or `interviewer` |
| `createdAt`, `updatedAt` | Date | Added by Mongoose timestamps |

The unique email index prevents two accounts from using the same normalized address. Passwords are never stored directly; only bcrypt hashes are saved.

## JobOpening

One record represents a position being recruited for.

| Field | Type | Notes |
|-------|------|-------|
| `title` | String | Required, trimmed, maximum 160 characters |
| `department` | String | Required, trimmed, maximum 100 characters |
| `description` | String | Required, trimmed, maximum 10,000 characters |
| `status` | String enum | `open`, `closed` or `archived`; defaults to `open` |
| `createdBy` | ObjectId → User | Required |
| `createdAt`, `updatedAt` | Date | Added automatically |

Indexes on `{ status, updatedAt }` and `{ department, status }` support the opening list and its common filters. Archiving is a state change rather than deletion, so related applications remain available.

## Application

An application represents one candidate applying to one opening. The same person may have separate applications to different openings, so candidate email is indexed but deliberately not globally unique.

| Field | Type | Notes |
|-------|------|-------|
| `jobOpening` | ObjectId → JobOpening | Required; an application cannot later move to another opening |
| `candidateName` | String | Required, trimmed, maximum 160 characters |
| `candidateEmail` | String | Required, lowercased and trimmed |
| `source` | String | Required, trimmed, maximum 100 characters |
| `notes` | String | Optional, trimmed, maximum 10,000 characters |
| `stage` | String enum | Applied, Screening, Interview, Offer, Hired or Rejected; defaults to Applied |
| `stageEnteredAt` | Date | When the application entered its current stage |
| `rejectedFromStage` | String enum or null | Remembers the exact stage to use if a rejected candidate is reinstated |
| `createdBy` | ObjectId → User | Recruiter who created the application |
| `createdAt`, `updatedAt` | Date | Added automatically |

The main compound index is `{ jobOpening, stage, updatedAt }`, which supports opening pipelines. Other indexes cover stalled-stage queries, source/date filtering, candidate name and email lookup, and created/updated sorting.

There is no unique constraint on `{ jobOpening, candidateEmail }`. That leaves room for repeat applications, but it also means the service currently allows an accidental duplicate application for the same opening. In a fuller product I would make that an explicit business decision and either add a compound unique index or introduce an application-cycle number.

## ApplicationEvent

This is the permanent timeline for an application.

| Field | Type | Notes |
|-------|------|-------|
| `application` | ObjectId → Application | Required |
| `type` | String enum | Creation, stage change, rejection, reinstatement, interviewer assignment/removal or feedback |
| `oldStage` | String enum or null | Stage before a transition |
| `newStage` | String enum or null | Stage after a transition |
| `feedback` | String or null | Interview feedback, maximum 10,000 characters |
| `metadata` | Mixed or null | Small event-specific details, such as the assigned interviewer ID |
| `performedBy` | ObjectId → User | Required actor |
| `createdAt` | Date | Creation time only; there is no `updatedAt` |

The timeline index `{ application, createdAt }` returns one application's history in order. A second index on `{ type, createdAt }` supports event reporting.

Mongoose hooks reject updates, replacements and deletions for this model. This protects the application through its normal database access path, although it is not a MongoDB-level prohibition: somebody with direct Atlas write access could still change a document. Stronger audit requirements would need restricted database credentials or a separate append-only audit store.

## PanelAssignment

This collection is the join between applications and interviewers.

| Field | Type | Notes |
|-------|------|-------|
| `application` | ObjectId → Application | Required |
| `interviewer` | ObjectId → User | Required |
| `assignedBy` | ObjectId → User | Required; normally the recruiter |
| `createdAt`, `updatedAt` | Date | Added automatically |

The unique compound index on `{ application, interviewer }` prevents the same interviewer being assigned twice to one application. The `{ interviewer, createdAt }` index supports the “My interviews” list.

This separate collection makes the application/interviewer relationship many-to-many without growing an embedded array on either record.

## Interview

An interview is a scheduled occurrence rather than just panel membership.

| Field | Type | Notes |
|-------|------|-------|
| `application` | ObjectId → Application | Required |
| `interviewer` | ObjectId → User | Required |
| `scheduledAt` | Date | Required |
| `status` | String enum | `scheduled`, `completed` or `cancelled`; defaults to scheduled |
| `createdAt`, `updatedAt` | Date | Added automatically |

Indexes support scheduled interviews by time/status, an interviewer's calendar, and the history of interviews for one application. The current UI reads seeded interview records for reporting; a full scheduling interface was outside the required scope.

## AlertDismissal

This records a recruiter's decision to hide one stalled alert at one stage.

| Field | Type | Notes |
|-------|------|-------|
| `application` | ObjectId → Application | Required |
| `stage` | String enum | One of the non-rejected pipeline stages |
| `dismissedBy` | ObjectId → User | Required |
| `createdAt`, `updatedAt` | Date | Added automatically |

The unique `{ application, stage }` index makes dismissal idempotent. Including the stage is important: after the application advances, its old dismissal no longer suppresses an alert in the new stage.

## Relationships

The main one-to-many relationships are:

- One recruiter can create many openings.
- One opening has many applications.
- One recruiter can create many applications.
- One application has many events.
- One user can perform many events.
- One application can have many interviews and alert dismissals over its lifetime.

Applications and interviewers are many-to-many through `PanelAssignment`. Interview records also connect an application and interviewer, but represent scheduled occurrences rather than access membership.

MongoDB does not provide foreign keys here. ObjectId references allow Mongoose to populate related records, but the database itself will not stop a referenced user or opening from being removed. The API exposes archive/status changes instead of destructive opening deletion, which avoids the most obvious orphaning case.

## Where constraints live

I used database indexes for rules that must remain true under concurrent writes:

- User email is unique.
- An interviewer cannot be assigned twice to the same application.
- A stalled alert can only be dismissed once per application and stage.

Mongoose schemas handle required values, enums, lengths, normalization and timestamps. The service layer handles rules that depend on existing records or the current state:

- Only recruiters may change the pipeline.
- Only users with the interviewer role may be assigned.
- Interviewers can only access assigned applications.
- An application must belong to an existing, non-archived opening when created.
- An application cannot be transferred to another opening.
- Stage movement must follow the defined sequence.
- Reinstatement must use `rejectedFromStage`.
- A dismissal is allowed only when the application is actually stalled.

These checks need context from more than one field or collection, and they also need useful HTTP error messages, so they fit better in services than simple schema validators. Transactions are used where the current application or panel state and its event must change together.

One limitation is that most required/enum rules are Mongoose validation rather than MongoDB collection validators. Direct writes outside this application could bypass them. For a team with several data writers, I would add database-level JSON Schema validation as a second line of defence.

## Intentional denormalisation

`Application.stage` is a current-state snapshot even though stage changes also exist in `ApplicationEvent`. Replaying the timeline for every candidate row and dashboard count would be unnecessarily expensive. Keeping the current value on the application makes everyday queries simple, while the event records preserve the explanation.

`stageEnteredAt` is also stored on the application so stalled candidates can be found with an indexed range query. It could be inferred from the newest stage event, but doing that repeatedly would make the alert query more complicated and slower.

`rejectedFromStage` duplicates a fact recorded in the rejection event. It allows reinstatement to validate and restore the prior stage without searching history. The transition transaction keeps these current-state fields and the new event consistent.

Apart from these current-state values, related objects are referenced instead of copied. API queries use population or aggregation to return the opening and user fields needed by a screen.

## What reaches its limit first at 100× the data

The first pressure point would be candidate text search. Case-insensitive, contains-style regular expressions over name and email cannot make full use of the simple indexes, so search would increasingly scan documents. I would move that feature to an Atlas Search index or another dedicated text-search service.

Offset pagination also becomes slower on deep pages because MongoDB still has to skip earlier matches. Cursor pagination using a stable sort field plus `_id` would scale better.

For interviewers with very large panels, the current search first loads all assigned application IDs and then uses an `$in` match. Starting the aggregation from `PanelAssignment`, or maintaining a purpose-built access query, would avoid building a large in-memory ID list.

The opening page currently asks for application counts separately for every opening. That creates an N+1 request pattern before the database itself becomes the bottleneck. A single grouped summary endpoint would be an early improvement.

Finally, dashboard aggregations and the event collection would receive steadily more work. I would review query plans, add retention or archive rules where appropriate, and precompute only the expensive reporting summaries. I would not cache core authorization or pipeline state until measurement showed it was necessary, because stale data there would be more harmful than a slightly slower response.
