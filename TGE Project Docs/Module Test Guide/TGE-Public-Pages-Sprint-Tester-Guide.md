# TGE Public Pages Sprint Tester Guide

**Purpose:** Manual and automated test plan for TGE-PUB-01 through TGE-PUB-14.
**Design source:** `TGE UI/Public Pages/` (compare desktop and mobile compositions).
**Status:** Business directory and page flows are implemented in the working tree. Contact submission (PUB-11) and newsletter delivery (PUB-13) remain blocked on the decisions listed below.

## Before testing

1. Install the client, server, and database dependencies using the project setup instructions.
2. Configure the server and database environment, start PostgreSQL, and apply committed migrations to a test database.
3. Start the API from `server/` with `npm run dev` and the client from `client/` with `npm run dev`.
4. Use a test database only. The public test event helper is `server/scripts/seed-public-pages-test-event.ts`; review its data before using it.
5. Keep a browser window at desktop width (about 1440 px) and repeat responsive checks around 390 px and 768 px. Keyboard-only checks should use Tab, Shift+Tab, Enter, Space, and Escape.
6. Compare the rendered routes with the matching screenshots in `TGE UI/Public Pages/`. Do not treat example businesses, counts, contact copy, event data, or article copy in a screenshot as production records.

## Sprint tasks

### TGE-PUB-01 — Confirm public page scope and contracts

- [ ] Confirm the public route inventory below and that sign-in, activation, password recovery, and access control continue to use the existing AUTH flows.
- [ ] Confirm anonymous APIs expose only published content and approved businesses.
- [ ] Confirm `TGE-PUB-01_Public_Page_Scope_and_Content_Contracts.md` lists unresolved status, localization, contact, and newsletter decisions accurately.
- [ ] Confirm Signup remains a membership application and does not create credentials or programme enrollment.

### TGE-PUB-02 — Shared public website shell

- [ ] Open Home, About, Programmes, Events, News, Business Directory, Contact, and Membership Application. Confirm the shared logo, header, active navigation, footer, and language switch appear.
- [ ] At desktop width, verify the horizontal navigation and footer columns match the designs. At mobile width, open/close the menu, navigate with keyboard, and close with Escape.
- [ ] Use the floating English/French switcher at the lower-right on multiple routes; confirm it stays fixed while scrolling and labels update without losing the current route.
- [ ] Confirm all internal navigation works. Login opens `/login`; membership links open `/membership-application`.

### TGE-PUB-03 — Home and About

- [ ] Compare `/` and `/about` to `TGE-Homepage.png` and `TGE-Aboutus.png` at desktop and mobile widths.
- [ ] Confirm Home previews link to their destination pages and show loading, empty, and unavailable states when the API has no data or is stopped.
- [ ] Confirm no sample metrics or invented production content are shown.

### TGE-PUB-04 — Programme browsing

- [ ] Open `/programmes`; confirm only published programmes appear, with usable detail/CTA links as supported by the current page.
- [ ] Verify an empty database shows an empty state, and a stopped API shows a safe error state.
- [ ] Confirm cohort, enrolment, participant, and member-only data never appears in anonymous responses.

### TGE-PUB-05 — Event listing and details

- [ ] Open `/events`; check upcoming and past groups, time zone formatting, event cards, and links to `/events/:eventId`.
- [ ] Open a published event and verify its public details. Open an unknown ID and confirm a safe not-found response.
- [ ] Confirm draft events and private fields such as meeting links, capacity, attendee data, staff assignments, and creator IDs are not returned publicly.

### TGE-PUB-06 — Read-only event gallery

- [ ] Open `/events/gallery` and confirm only approved media for published events is displayed.
- [ ] Confirm missing alt text, non-HTTPS URLs, and hosts absent from `PUBLIC_MEDIA_HOSTS` are excluded.
- [ ] Confirm the anonymous page has no upload or approval control.

### TGE-PUB-07 — Event registration

- [ ] On an upcoming published event, submit valid guest name, email, phone, and consent; verify the confirmation appears only after API success.
- [ ] Try invalid fields, missing consent, duplicate active email, closed deadline, full capacity, and an unpublished/nonexistent event.
- [ ] Verify registration writes the accepted consent timestamp/version and does not expose a registration record to the browser.

### TGE-PUB-08 — News browsing

- [ ] Open `/news` and `/news/:slug`; verify published articles only and newest-first ordering.
- [ ] Confirm draft, future-dated, and unknown slugs produce the same safe not-found result.
- [ ] Verify article loading/error/empty states and the newsletter form in the sidebar and shared footer.

### TGE-PUB-09 — Public Business Directory

- [ ] Open `/business-directory`; confirm anonymous users see only active, approved businesses.
- [ ] Search by business name, description keyword, and category. Select a category, reset to all categories, and page through results; verify the result count and stable ordering.
- [ ] Confirm empty, no-match, loading, category-error, and API-error states.
- [ ] Follow a card to its detail route. Use “List Your Business” and confirm it goes through the existing login flow.
- [ ] Inspect the anonymous API response: no member IDs, private review data, or internal approval metadata.

### TGE-PUB-10 — Public business details

- [ ] Open an approved business detail URL and compare `/business-directory/:slug` to `TGE-BusinessDirectory-Details.png` on desktop and mobile.
- [ ] Verify only the approved API fields appear: name, description, category, address, and validated public website/email/phone destinations where present.
- [ ] Confirm external websites open safely in a new tab and invalid/non-HTTPS website values are omitted.
- [ ] Try unknown, draft, suspended, and unapproved slugs; each must return the same safe not-found state.
- [ ] Record that products/services, impact, listing-specific gallery, and social links are not represented by the current approved public API/schema and must not be fabricated.

### TGE-PUB-11 — Contact Us and enquiry submission

- [ ] Compare `/contact` to `TGE-Contactus.png`; check the office/contact information, responsive layout, required fields, consent, loading, and error feedback.
- [ ] Try missing/invalid fields and confirm browser and server validation.
- [ ] **Expected current release gate:** a valid submission returns a generic unavailable error (HTTP 503) and is not stored. Do not mark submission success until TGE approves the handling service, privacy wording, consent record policy, and retention behavior (decision D7).

### TGE-PUB-12 — Membership application

- [ ] Open `/membership-application` and compare it with `TGE-Signup.png`. Confirm the copy identifies an application, not direct account creation.
- [ ] Submit valid first name, last name, email, optional phone, and acknowledgement. Verify the safe receipt state.
- [ ] Try malformed input and API unavailable behavior. Submit a duplicate email and confirm safe, non-disclosing feedback.
- [ ] Verify no password, active user account, role assignment, or programme enrollment is created. Existing AUTH invitation/activation remains the next step after approval.
- [ ] Confirm public Google/Facebook/Apple sign-in is absent.

### TGE-PUB-13 — Newsletter subscription

- [ ] Confirm the email field and Subscribe button appear in both the News sidebar and shared footer, matching `TGE-News.png` and the other supplied page designs.
- [ ] Submit malformed email and verify client-side validation prevents the request.
- [ ] **Expected current release gate:** a valid request returns the unavailable state (HTTP 503); the UI must not claim success. No subscription data is stored until TGE selects the provider or approves local persistence, consent, confirmation, unsubscribe, and retention behavior (decision D8).

### TGE-PUB-14 — Sprint integration and regression

- [ ] Run the client production build and server typecheck/test scripts; record command output and date.
- [ ] Repeat route, keyboard, language, and responsive checks after integration.
- [ ] Confirm anonymous API responses contain no private data and that event registration/application behavior still matches their approved contracts.
- [ ] Record the D7 and D8 release gates plus content/localization gaps. Do not mark the sprint fully complete until those decisions are resolved and the final acceptance tests pass.

## Current release dependencies

| Decision | Affected task | Required before marking complete |
|---|---|---|
| D7 — contact handling and consent | TGE-PUB-11 | Approve handling service or persistence, privacy wording, consent treatment, recipient/assignment, retention, and abuse policy. |
| D8 — newsletter delivery | TGE-PUB-13 | Select the provider or approve the existing local model and define consent, confirmation/double opt-in, unsubscribe, and retention behavior. |
| D9 — production content and URLs | TGE-PUB-03/09/10/11 | Approve real English/French copy, business media and featured status, contact details, social URLs, and verified impact content. |
| Dynamic content localization | TGE-PUB-03/04/05/08/09/10 | Decide how stored English/French records and missing translations should behave. |

## Check results

Implementation check, 2026-11-04:

- [x] `client/npm run build` — passed; static and partial-prerender routes generated.
- [x] `server/npm run typecheck` — passed.
- [x] `server/npm test` — 39 passed, 0 failed.
- [ ] Browser visual comparison — not completed. The computer-use runtime could not determine Chrome's current URL confidently, so it stopped before navigating. Perform the manual design comparison above before release.
- [ ] Contract gates D7 and D8 — still open; PUB-11 and PUB-13 are not complete until approvals and integrations are in place.

Record the tester, date, environment, browser/device, commands, pass/fail notes, and linked defects here before release. Automated checks passing do not replace the manual visual checks above.
