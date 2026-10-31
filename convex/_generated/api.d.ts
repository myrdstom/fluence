/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_borrowRequests from "../lib/borrowRequests.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_dates from "../lib/dates.js";
import type * as lib_notifications from "../lib/notifications.js";
import type * as lib_signature from "../lib/signature.js";
import type * as notifications from "../notifications.js";
import type * as reminders from "../reminders.js";
import type * as requests from "../requests.js";
import type * as tools from "../tools.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/borrowRequests": typeof lib_borrowRequests;
  "lib/constants": typeof lib_constants;
  "lib/dates": typeof lib_dates;
  "lib/notifications": typeof lib_notifications;
  "lib/signature": typeof lib_signature;
  notifications: typeof notifications;
  reminders: typeof reminders;
  requests: typeof requests;
  tools: typeof tools;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
