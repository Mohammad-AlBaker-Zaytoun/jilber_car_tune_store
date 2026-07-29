/**
 * Single shared PrismaClient.
 *
 * In dev, Next.js HMR re-evaluates modules on every edit; without caching on
 * globalThis we'd open a new connection pool each time and exhaust the DB.
 *
 * Prisma 7 requires a driver adapter for every database — see lib/db/adapter.ts.
 *
 * LAZY BY DESIGN. Under Prisma 6, `new PrismaClient()` was cheap and did not
 * need a connection string until the first query. Under Prisma 7 the adapter is
 * built eagerly from DATABASE_URL, so constructing at module scope meant that
 * merely *importing* any repository module (lib/orders.ts, lib/users.ts, …)
 * threw when DATABASE_URL was unset — which broke the unit tests for the pure
 * helpers that happen to live in those files, and would break any script that
 * imports one without needing the database.
 *
 * The proxy below restores the old behaviour: nothing is constructed until a
 * property is actually touched.
 */
import { PrismaClient } from '@prisma/client';
import { createPrismaAdapter } from './adapter';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  // Cached on globalThis in every environment: in dev to survive HMR, in
  // production because the module registry is not a guaranteed singleton across
  // Next's server bundles.
  globalForPrisma.prisma ??= new PrismaClient({
    adapter: createPrismaAdapter(),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
  return globalForPrisma.prisma;
}

/**
 * Bound-method cache.
 *
 * Without it every property access mints a new bound function, so
 * `prisma.$transaction !== prisma.$transaction`. That breaks identity
 * comparison and anything keyed on a client method in a Map/Set.
 */
const boundMethods = new WeakMap<object, Map<PropertyKey, unknown>>();

function bindOnce(client: PrismaClient, prop: PropertyKey, fn: (...a: never[]) => unknown) {
  let perClient = boundMethods.get(client);
  if (!perClient) {
    perClient = new Map();
    boundMethods.set(client, perClient);
  }
  let bound = perClient.get(prop);
  if (!bound) {
    bound = fn.bind(client);
    perClient.set(prop, bound);
  }
  return bound;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    // Deliberately NOT forwarding the proxy as `receiver`. The receiver exists
    // to support inheritance, which this proxy does not model — and any real
    // prototype getter on the client would then run with `this` bound to a proxy
    // whose target is `{}`, breaking private-field access.
    const value = Reflect.get(client, prop);
    return typeof value === 'function'
      ? bindOnce(client, prop, value as (...a: never[]) => unknown)
      : value;
  },
  set(_target, prop, value) {
    // Without this, assignments fall through to the empty target and vanish:
    // `get` never consults the target, so the write is silently unobservable.
    return Reflect.set(getClient(), prop, value);
  },
  has(_target, prop) {
    // `'order' in prisma` must not construct a client — feature-detection is a
    // normal thing for a test harness to do, and throwing here would defeat the
    // whole point of the lazy wrapper.
    if (!globalForPrisma.prisma) return false;
    return Reflect.has(globalForPrisma.prisma, prop);
  },
  deleteProperty(_target, prop) {
    return Reflect.deleteProperty(getClient(), prop);
  },
  ownKeys() {
    // Otherwise Object.keys(prisma) and {...prisma} return [].
    return Reflect.ownKeys(getClient());
  },
  getOwnPropertyDescriptor(_target, prop) {
    const desc = Reflect.getOwnPropertyDescriptor(getClient(), prop);
    // A proxy may only report a non-configurable property if the target has it;
    // the target here is `{}`, so force configurable to keep the invariant.
    return desc ? { ...desc, configurable: true } : undefined;
  },
  getPrototypeOf() {
    return Reflect.getPrototypeOf(getClient());
  },
});
