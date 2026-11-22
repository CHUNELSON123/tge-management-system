# Public Pages module

Public website UI lives here. Files in `src/app` are route entry points that re-export the matching page from this module. Shared visual and interaction components live under `components/`; page views live under `pages/`; API clients live under `services/`.

The module contains Home, About, Programmes, Events, event detail/gallery/registration, News and article, business directory and details, Contact, and membership application views. Page labels use the existing English/French provider. Developer-provided photographs are crops from the matching supplied design screenshots under `TGE UI/Public Pages/`; no substitute generated business or office imagery is used.

## Data ownership

The frontend consumes public APIs and does not duplicate content models. Business browsing/detail routes use `GET /api/public/businesses`, `/business-categories`, and `/businesses/:slug`. The server returns active, approved businesses and a public field allowlist. The current Business model has no featured flag, approved media URLs, products/services, impact, or social links; do not fill those design areas with invented listing content.

Contact and newsletter forms validate client input and call their public routes. Those routes return an unavailable response without writing data until the approved handling service/provider and consent behavior are selected. See the Public Pages backend README and tester guide for these release dependencies.

Records remain in their owning Prisma domains: `website.prisma` (Page and News), `programmes.prisma`, `events.prisma`, and `business-directory.prisma`. Do not create duplicate public copies of those models.
