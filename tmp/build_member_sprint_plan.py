from docx import Document
from docx.oxml import OxmlElement
from pathlib import Path

TEMPLATE=Path(r"C:\Users\FLAVIN\Downloads\TGE_Sprint1_Public_Pages_Backlog.docx")
OUT=Path(r"C:\tge-management-system\TGE Member Portal Foundation Sprint Plan.docx")
d=Document(TEMPLATE)
body=d._element.body
for child in list(body):
    if child.tag != OxmlElement("w:sectPr").tag: body.remove(child)

def p(text="",style="Normal"):
    q=d.add_paragraph(style=style); q.add_run(text); return q
def b(text): p(text,"List Bullet")
def card(code,title,desc,scope,criteria):
    p(f"{code} — {title}","Heading 2")
    p("Description"); p(desc)
    p("Scope")
    for x in scope: p(x)
    p("Acceptance criteria")
    for x in criteria: p("☐  "+x)
    p("Trello fields to complete: Owner • Priority • Estimate • Sprint")

p("TGE MANAGEMENT SYSTEM")
p("Member Management","Title")
p("Proposed Sprint Backlog")
p("16 Trello-ready task cards covering all 12 supplied member-page designs")
p("How to Use This Backlog","Heading 1")
p("Use this document as a proposal for the next member-portal sprint. Review the cards with the team, confirm dependencies and open decisions, agree estimates and owners, and commit only work that fits the sprint capacity. Sprint duration and team capacity were not provided, so estimate the full backlog before committing it as one sprint.")
p("This backlog is structured like the supplied Sprint 1 Public Pages backlog. Each member-page design has its own task card, with frontend, backend, and database responsibilities and acceptance criteria. A page is not complete merely because its visual shell renders: actions must use approved contracts and real data, or be clearly unavailable until their dependencies are approved.")
p("Reuse the existing authentication, authorization, User–Member relationship, Prisma models, and English/French frontend setup. Do not rebuild account creation, invitations, verification, password or JWT behavior. The current schema already includes a one-to-one User–Member relationship, membership number, joined date, and membership status. Do not add duplicate fields or tables without a reviewed need and approved migration.")
p("The supplied designs include programme, event, mentorship, resource, messaging, notification, business, settings, and help experiences. The existing schema contains several related records, but the repository does not yet provide all member-scoped APIs and policies required by these designs. The relevant cards call out these dependencies; do not use fabricated counts, people, messages, activity, or other sample data as production content.")
p("The strategic plan identifies member-management CRM as a digital foundation and sets active-member targets of 40 in 2026, 80 in 2027, and 130 in 2028. The portal supports member access and the progressive cohort and mentoring journey; it does not itself deliver fee collection, programme delivery, mentoring outcomes, or KPI reporting.")
p("Proposed Trello Groups","Heading 2")
for x in [
 "Epic A — Member Portal Foundation and Shared Shell: TGE-MEM-01 to TGE-MEM-02",
 "Epic B — Member Dashboard, Profile, and Settings: TGE-MEM-03 to TGE-MEM-05",
 "Epic C — Programmes and Events: TGE-MEM-06 to TGE-MEM-08",
 "Epic D — Mentorship, Resources, and Businesses: TGE-MEM-09 to TGE-MEM-11",
 "Epic E — Messages, Notifications, and Help: TGE-MEM-12 to TGE-MEM-14",
 "Epic F — Integration and Sprint Completion: TGE-MEM-15 to TGE-MEM-16"]: b(x)
p("Reviewed sources","Heading 2")
for x in [
 "TGE_Member_Management_Sprint_Backlog.docx — proposed member-management work, authentication decisions, data-model notes, and acceptance boundaries.",
 "Plan_Strategique_TGE_2026-2028.docx — member growth goals, member-management CRM direction, cohort journey, mentoring strategy, and impact targets.",
 "Supplied member UI designs: Dashboard, Profile, Programmes, My Events, Event Details, Mentorship, Resources, Messages, Notifications, My Businesses, Settings, and Help & Support.",
 "Existing TGE authentication/session flow, role and permission policy, Prisma identity and feature models, and English/French frontend setup."]:
    b(x)
p("Status: Proposed backlog — not yet committed to a sprint.")

p("Epic A — Member Portal Foundation and Shared Shell","Heading 1")
card("TGE-MEM-01","Confirm Member Portal Scope and Contracts",
     "Map all supplied member designs to approved page behavior, existing domain records, permissions, and required service contracts before implementation.",
     ["Frontend: map the 12 designs to routes, actions, responsive states, and English/French text; mark illustrative content separately from real member data.",
      "Backend: identify member-scoped reads and writes, role permissions, status rules, and API dependencies for every page.",
      "Database: map designs to existing User, Member, programme, event, mentorship, resource, messaging, notification, and business models; identify genuine contract gaps without duplicating data."],
     ["The scope inventory includes all 12 supplied member pages listed under Reviewed sources.",
      "Account status and membership status remain distinct; portal access rules and permitted transitions are recorded.",
      "Every proposed page action maps to an existing or planned API contract, or is marked as a dependency before release.",
      "Editable profile fields, email changes, notification preferences, event saved-state, support handling, business actions, and account closure rules are documented before affected controls are enabled.",
      "No UI-only field is assumed to exist in storage; any schema proposal has a business reason and migration review." ])
card("TGE-MEM-02","Build the Shared Member Portal Shell",
     "Implement the reusable authenticated member navigation and page frame shown across the supplied desktop and mobile designs.",
     ["Frontend: implement responsive member navigation, active-page state, account identity area, breadcrumb/page container, and mobile navigation using the existing client architecture.",
      "Backend: reuse existing session validation and logout behavior; no new authentication flow.",
      "Database: none."],
     ["Only an authenticated Member role sees the member shell; existing admin, mentor, and trainer destinations continue to work.",
      "Navigation includes the 12 member destinations and each destination routes to its corresponding sprint page.",
      "Unavailable actions or pages are visibly identified and are not presented as working controls.",
      "The shell is keyboard accessible, responsive, and supports the existing English/French language system.",
      "Expired or invalid sessions return through the existing login flow." ])

p("Epic B — Member Dashboard, Profile, and Settings","Heading 1")
card("TGE-MEM-03","Implement the Member Dashboard",
     "Build the supplied Member Dashboard as the authenticated member landing page, using real member data and supported module summaries only.",
     ["Frontend: implement the welcome area, summary cards, upcoming activity areas, recent announcements, and quick-link layout where supported by real contracts.",
      "Backend: provide a member-scoped dashboard response using existing profile and approved feature APIs.",
      "Database: reuse existing records and safe aggregates; no fabricated values or dashboard-only duplicate tables."],
     ["The welcome identifies the current member where a display name exists.",
      "Dashboard counts and lists come from member-scoped records and use agreed status/date rules.",
      "Unsupported programme, event, mentorship, certificate, announcement, or business data is shown as unavailable/empty, never as sample production data.",
      "Quick links navigate only to implemented member pages.",
      "Loading, empty, incomplete-profile, error, and responsive states follow the design." ])
card("TGE-MEM-04","Implement My Profile",
     "Build the supplied Member Profile experience for viewing approved personal, professional, and membership information.",
     ["Frontend: implement profile summary, profile completion only if its calculation is approved, section navigation, and approved edit states.",
      "Backend: provide self-profile read and permitted updates using the authenticated user identity.",
      "Database: reuse existing User and Member fields; review any proposed profile attributes before adding migrations."],
     ["A member can view only their own approved profile and membership details.",
      "Only approved editable fields are exposed; role, account status, membership status, and protected identifiers cannot be changed by self-service.",
      "Profile completion indicators use a documented formula or are omitted.",
      "Save, validation, loading, failure, and missing-field states are clear and preserve unrelated input.",
      "The responsive page and all new text follow the supplied design and bilingual system." ])
card("TGE-MEM-05","Implement Member Settings",
     "Build the supplied Settings page for account preferences and security controls that have approved server-side behavior.",
     ["Frontend: implement settings navigation and approved account, notification, privacy, and appearance controls.",
      "Backend: reuse existing password-change and profile services; add preference APIs only after policy and persistence are approved.",
      "Database: reuse existing fields where available; no preference or deletion schema without review."],
     ["Current supported settings are connected to real APIs and persist after reload.",
      "Password changes use the existing authenticated password-change flow.",
      "Notification, privacy, language, timezone, and email preferences are not shown as saved unless a real approved contract supports them.",
      "Account deletion or irreversible actions are excluded unless retention, confirmation, recovery, and authorization policies are approved.",
      "The page provides safe validation and outcome feedback in desktop and mobile layouts." ])

p("Epic C — Programmes and Events","Heading 1")
card("TGE-MEM-06","Implement My Programmes",
     "Build the supplied programme dashboard for a member's enrolled, completed, and available programmes.",
     ["Frontend: implement programme tabs, search/filter where supported, progress presentation, and links to supported programme details.",
      "Backend: provide member-scoped enrollment and programme reads with authorization and approved progress rules.",
      "Database: reuse programme, cohort, enrollment, and assignment records; do not expose another member's progress."],
     ["Enrolled and completed lists reflect persisted member assignments and agreed completion status.",
      "Available programmes follow documented eligibility and membership rules.",
      "Progress percentages and next lessons appear only when backed by approved learning-progress data.",
      "The page shows clear empty, loading, error, and responsive states.",
      "Search and filters work according to the API contract; unsupported controls are omitted." ])
card("TGE-MEM-07","Implement My Events",
     "Build the supplied member event list for upcoming, past, and saved event views where supported.",
     ["Frontend: implement event tabs, search/category filters, event cards, calendar action, and links to event details.",
      "Backend: query events and registrations scoped to the authenticated member; define saved-event behavior only if an approved model/API exists.",
      "Database: reuse Event and EventRegistration; no duplicate event or saved-event storage without approval."],
     ["Upcoming and past lists use persisted event dates and member registration state.",
      "Saved Events is functional only if an approved persistence contract exists; otherwise the control is omitted or clearly unavailable.",
      "Calendar export uses the actual event time and timezone.",
      "Private, unpublished, or unauthorized event data is not returned.",
      "Empty, error, loading, mobile, and desktop states are implemented." ])
card("TGE-MEM-08","Implement My Event Details",
     "Show event details and the current member's registration state using the supplied Event Details design.",
     ["Frontend: implement event overview, agenda, speakers, location, attendee and resource sections only when data is approved and available.",
      "Backend: return public/authorized event details and the current member's own registration information.",
      "Database: reuse Event, EventRegistration, and approved event relations; do not expose another attendee's private information."],
     ["A member sees event details only when the event is accessible to that member.",
      "Registration status is derived from the member's persisted registration.",
      "Ticket, cancellation, sharing, attendee list, and resource actions work only when their contracts and permissions are approved.",
      "Missing or inaccessible event identifiers return a safe not-found state.",
      "The detail page matches desktop/mobile hierarchy without invented event content." ])

p("Epic D — Mentorship, Resources, and Businesses","Heading 1")
card("TGE-MEM-09","Implement My Mentorship",
     "Build the supplied mentorship page for the member's assignments, sessions, hours, and mentor discovery where supported.",
     ["Frontend: implement mentorship summary, active assignments, upcoming session, history, and recommended mentors only for available services.",
      "Backend: enforce member-scoped assignment reads and approved mentor visibility; define session actions with the mentorship workflow.",
      "Database: reuse Mentor, MentorAssignment, and MentoringProgressRecord; review any new session model separately."],
     ["Members can view only their own mentorship assignments and session information.",
      "Mentor profile details and contact actions follow approved visibility and privacy rules.",
      "Hours, ratings, recommendations, scheduling, and rescheduling are backed by real data and defined workflows or omitted.",
      "No invented mentor profiles, availability, reviews, or session counts appear.",
      "The page includes empty, loading, error, and responsive states." ])
card("TGE-MEM-10","Implement Member Resources",
     "Build the supplied Resources page for training materials and organizational documents available to the current member.",
     ["Frontend: implement resource categories, search/sort where supported, featured and recently added resources, and safe view/download actions.",
      "Backend: return resources authorized for the member and deliver downloads using approved storage access.",
      "Database: reuse Resource and ResourceVersion records and existing visibility/access rules."],
     ["Members can access only resources permitted by their role and assignments.",
      "Search, categories, sort, version labels, and file metadata reflect supported query fields.",
      "Download links do not expose private storage keys or bypass access checks.",
      "Unsupported preview/download formats are clearly reported.",
      "No fabricated resources or file sizes are displayed." ])
card("TGE-MEM-11","Implement My Businesses",
     "Build the supplied My Businesses page for member-owned business listings and supported profile actions.",
     ["Frontend: implement business overview, cards, supported profile status, and create/edit actions only when available.",
      "Backend: scope business reads and writes to the authenticated member and enforce approval/publication permissions.",
      "Database: reuse Business and its existing Member relationship; review any extra metrics or business fields before schema changes."],
     ["A member can see only business records they are authorized to manage.",
      "Create/edit controls use protected APIs and reflect review/approval status accurately.",
      "Profile views, inquiries, ratings, and growth percentages are omitted unless real approved metrics exist.",
      "Public profile links expose only approved public fields.",
      "Empty, loading, error, and responsive states match the supplied design." ])

p("Epic E — Messages, Notifications, and Help","Heading 1")
card("TGE-MEM-12","Implement Member Messages",
     "Build the supplied Messages page for authenticated member conversations and file sharing supported by an approved messaging contract.",
     ["Frontend: implement conversation list, selected conversation, search, message composer, and contact details where supported.",
      "Backend: enforce conversation membership on every read, send, attachment, and contact action.",
      "Database: reuse Conversation, ConversationParticipant, and Message models; review attachment storage/access separately."],
     ["Members can read and send messages only in conversations they belong to.",
      "Message ordering, unread counts, online state, and timestamps use actual persisted or live service data.",
      "Sending failures retain the draft and give safe feedback.",
      "Attachments are available only through authorized storage links.",
      "No sample conversation, message, or presence data is presented as real." ])
card("TGE-MEM-13","Implement Member Notifications",
     "Build the supplied Notifications page for member-targeted announcements and activity updates.",
     ["Frontend: implement notification list, category tabs, unread state, mark-as-read, and preferences only where supported.",
      "Backend: return notifications addressed to the authenticated member and enforce read/update ownership.",
      "Database: reuse Notification and approved announcement targeting; confirm preference persistence before exposing save controls."],
     ["Every listed notification is authorized for the current member.",
      "Unread counts and mark-as-read behavior reflect persisted state.",
      "Category filtering uses supported notification types.",
      "Notification preferences are editable only if an approved API stores them.",
      "The page includes empty/error/loading states and supports mobile layouts." ])
card("TGE-MEM-14","Implement Help and Support",
     "Build the supplied Help & Support page with searchable help content and contact options that have approved destinations.",
     ["Frontend: implement help search, knowledge base/FAQ, support contact form, support hours, and alternate contact channels from approved content.",
      "Backend: use approved help content and support submission handling; apply validation and abuse controls.",
      "Database: reuse approved content or enquiry storage only; no ad hoc persistence for support messages."],
     ["Search and FAQ controls return relevant approved help content or a clear no-results state.",
      "A support enquiry reports success only after an approved handler accepts it.",
      "Contact details and office hours come from approved TGE content.",
      "If the support handler or privacy wording is not approved, submission remains blocked and is shown honestly.",
      "The desktop and mobile layouts follow the supplied design." ])

p("Epic F — Integration and Sprint Completion","Heading 1")
card("TGE-MEM-15","Integrate Member APIs, Permissions, and Shared States",
     "Connect the member pages to their service contracts and verify consistent authorization, localization, errors, and data handling.",
     ["Frontend: use established client service patterns, shared components, accessible states, and existing English/French localization.",
      "Backend: apply authenticated role and record-ownership checks to every member-specific endpoint; return safe response DTOs.",
      "Database: confirm existing models/relations are used and migration changes are reviewed and approved."],
     ["The member's identity comes from the verified session, never an arbitrary client-supplied member ID.",
      "Each page's real actions map to a documented API; unresolved external/provider/policy dependencies are recorded.",
      "Sensitive fields, cross-member data, private media, and internal storage details are not exposed.",
      "Loading, empty, validation, success, and failure states are consistent across the pages.",
      "No new schema or permission grants are introduced without review." ])
card("TGE-MEM-16","Verify Member Pages and Complete Tester Handoff",
     "Verify the 12 supplied member pages against approved contracts and document the sprint behavior for the tester.",
     ["Frontend: verify all 12 page routes, supplied desktop/mobile layouts, language labels, navigation, and available controls.",
      "Backend: verify authentication, role checks, member ownership, validation, and safe errors for included endpoints.",
      "Database: verify real persisted data, migration state, and absence of unsupported sample content."],
     ["All 12 supplied designs are accounted for by named task cards and verified routes or explicit documented blockers.",
      "Automated and manual checks cover positive access, wrong role, expired session, cross-member requests, empty data, and API failure.",
      "The tester guide states required synthetic accounts/data, steps, expected results, and known dependencies without sharing credentials.",
      "No dead control claims an action succeeded when its API is unavailable.",
      "Remaining defects and policy dependencies are recorded before sprint completion." ])

p("Team planning note","Heading 1")
p("The complete 16-card backlog is a proposal, not a capacity-verified commitment. During planning, estimate the work and split the sprint if it exceeds the team's capacity. Confirm profile fields and status rules, programme eligibility, event registration/saved-event behavior, mentorship session rules, resource access, message attachment policy, notification preferences, business edit/approval flow, account settings, and help-desk handling before committing the affected cards. The page designs define the visual targets; they do not by themselves approve persistence, privacy, access, or workflow behavior.")

d.core_properties.title="TGE Member Management Sprint Backlog"
d.core_properties.subject="Proposed member portal sprint backlog covering all supplied member-page designs"
d.core_properties.author="The Green Entrepreneur"
d.save(OUT)
print(OUT)
