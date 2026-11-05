import test from "node:test";
import assert from "node:assert/strict";
import { PrismaPublicBusinessesRepository, safePublicBusinessWebsite } from "./prisma-public-businesses.repository.js";

test("public business list applies public visibility to search and pagination and excludes private relations", async () => {
  let listArgs: Record<string, unknown> | undefined;
  let countArgs: Record<string, unknown> | undefined;
  const record = { id: "b1", slug: "green-business", name: "Green Business", description: "Description", address: "Public business address", categories: [{ category: { id: "c1", name: "Food" } }] };
  const database = {
    business: {
      findMany: async (args: Record<string, unknown>) => { listArgs = args; return [record]; },
      count: async (args: Record<string, unknown>) => { countArgs = args; return 25; },
    },
    $transaction: async (queries: Promise<unknown>[]) => Promise.all(queries),
  } as never;
  const page = await new PrismaPublicBusinessesRepository(database).listApprovedBusinesses({ q: "green", categoryId: "c1", page: 2, pageSize: 12 });
  assert.equal(page.totalPages, 3);
  assert.equal(page.items[0].slug, record.slug);
  assert.deepEqual(page.items[0].categories, [{ id: "c1", name: "Food" }]);
  assert.equal(listArgs?.skip, 12);
  assert.equal(listArgs?.take, 12);
  assert.deepEqual(listArgs?.orderBy, [{ name: "asc" }, { id: "asc" }]);
  assert.deepEqual(listArgs?.where, countArgs?.where);
  const where = listArgs?.where as Record<string, unknown>;
  assert.equal(where.status, "active");
  assert.equal(where.publicationStatus, "approved");
  assert.deepEqual(where.categories, { some: { categoryId: "c1" } });
  assert.equal(JSON.stringify(listArgs?.select).includes("member"), false);
  assert.equal(JSON.stringify(listArgs?.select).includes("reviews"), false);
  assert.equal(JSON.stringify(listArgs?.select).includes("StorageKey"), false);
});

test("public business categories count only visible business associations", async () => {
  let args: Record<string, unknown> | undefined;
  const database = { businessCategory: { findMany: async (input: Record<string, unknown>) => { args = input; return [{ id: "c1", name: "Food", _count: { businesses: 2 } }]; } } } as never;
  const categories = await new PrismaPublicBusinessesRepository(database).listPublicCategories();
  const visibility = { status: "active", publicationStatus: "approved" };
  assert.deepEqual(categories, [{ id: "c1", name: "Food", count: 2 }]);
  assert.deepEqual(args?.where, { businesses: { some: { business: visibility } } });
  assert.deepEqual(args?.select, { id: true, name: true, _count: { select: { businesses: { where: { business: visibility } } } } });
});

test("business details require an approved active listing and remove unsafe contact destinations", async () => {
  let args: Record<string, unknown> | undefined;
  const record = { id: "b1", slug: "green-business", name: "Green Business", description: null, address: null, categories: [], websiteUrl: "javascript:alert(1)", email: "not-an-email", phone: "<script>" };
  const database = { business: { findFirst: async (input: Record<string, unknown>) => { args = input; return record; } } } as never;
  const detail = await new PrismaPublicBusinessesRepository(database).findApprovedBusinessBySlug(record.slug);
  assert.deepEqual(args?.where, { slug: record.slug, status: "active", publicationStatus: "approved" });
  assert.equal(detail?.websiteUrl, null);
  assert.equal(detail?.email, null);
  assert.equal(detail?.phone, null);
  assert.equal(JSON.stringify(args?.select).includes("member"), false);
  assert.equal(safePublicBusinessWebsite("https://example.org/path"), "https://example.org/path");
  assert.equal(safePublicBusinessWebsite("https://user:password@example.org/"), null);
  assert.equal(safePublicBusinessWebsite("http://example.org/"), null);
});
