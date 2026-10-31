/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

export function createTest() {
  return convexTest(schema, modules);
}

export type TestConvex = ReturnType<typeof createTest>;

/** Signs a new user up, returning their ID and a client that acts as them. */
export async function addUser(t: TestConvex, name: string) {
  const client = t.withIdentity({
    subject: name,
    issuer: "https://test.clerk.dev",
    name,
    email: `${name}@example.com`,
  });
  const id = await client.mutation(api.users.store, {});
  return { id, client };
}

export async function addAdmin(t: TestConvex, name: string) {
  const user = await addUser(t, name);
  await t.run((ctx) => ctx.db.patch("users", user.id, { role: "admin" }));
  return user;
}

type Client = Awaited<ReturnType<typeof addUser>>["client"];

export function addTool(owner: Client, name = "Cordless drill") {
  return owner.mutation(api.tools.create, {
    name,
    category: "power_tools",
    condition: "good",
    description: "18V with two batteries.",
  });
}

export const FIRST_PAGE = { numItems: 20, cursor: null };
