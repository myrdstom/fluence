import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import { addUser, createTest } from "./test.helpers";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("users.store", () => {
  test("creates new users with the lowest privileges", async () => {
    const t = createTest();
    const { client } = await addUser(t, "ada");

    expect(await client.query(api.users.me, {})).toMatchObject({
      name: "ada",
      role: "user",
      isTrustedLender: false,
    });
  });

  test("rejects signed-out callers", async () => {
    const t = createTest();
    await expect(t.mutation(api.users.store, {})).rejects.toThrow(
      "Not authenticated",
    );
  });

  test("keeps one record and preserves role and trust on repeat sign-ins", async () => {
    const t = createTest();
    const { id, client } = await addUser(t, "ada");
    await t.run((ctx) =>
      ctx.db.patch("users", id, { role: "admin", isTrustedLender: true }),
    );

    expect(await client.mutation(api.users.store, {})).toBe(id);
    expect(await client.query(api.users.me, {})).toMatchObject({
      role: "admin",
      isTrustedLender: true,
    });
  });
});

describe("users.me", () => {
  test("returns null when signed out and hides the email", async () => {
    const t = createTest();
    const { client } = await addUser(t, "ada");

    expect(await t.query(api.users.me, {})).toBeNull();
    expect(await client.query(api.users.me, {})).not.toHaveProperty("email");
  });
});

describe("users.setRole", () => {
  test("changes the role of the user with that email", async () => {
    const t = createTest();
    const { client } = await addUser(t, "ada");

    await t.mutation(internal.users.setRole, {
      email: "ada@example.com",
      role: "admin",
    });

    expect(await client.query(api.users.me, {})).toMatchObject({
      role: "admin",
    });
  });

  test("rejects an unknown email", async () => {
    const t = createTest();
    await expect(
      t.mutation(internal.users.setRole, {
        email: "nobody@example.com",
        role: "admin",
      }),
    ).rejects.toThrow("Expected exactly one user");
  });
});
