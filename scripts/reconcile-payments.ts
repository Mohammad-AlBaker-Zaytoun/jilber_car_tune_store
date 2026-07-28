/**
 * Whish payment reconciliation.
 *
 * WHY THIS EXISTS
 * The success callback is the only path that marks a card order paid. If Whish's
 * request is dropped, times out, or the status query fails, the customer has been
 * charged but the order sits `unpaid` forever — no confirmation email, no admin
 * alert, and nothing anywhere that notices. That is silent, unbounded money loss.
 *
 * This job re-queries Whish for every order that was sent to payment but never
 * confirmed, and settles the ones that actually went through. It is idempotent
 * (markOrderPaidByWhish is an atomic conditional update) and safe to run as often
 * as you like.
 *
 * USAGE
 *   npm run reconcile:payments             # settle orders older than 10 minutes
 *   npm run reconcile:payments -- --dry-run
 *   npm run reconcile:payments -- --older-than-minutes=30
 *
 * Run it from cron every 15 minutes — see deploy/crontab.example.
 * Exits non-zero if anything could not be reached, so cron mail / monitoring fires.
 */

import { getUnconfirmedWhishOrders } from '../lib/orders';
import { settleWhishOrder } from '../lib/payments/whish-settle';
import { isWhishConfigured } from '../lib/payments/whish';
import { prisma } from '../lib/db/prisma';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=')[1];
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const olderThanMinutes = Number(arg('older-than-minutes') ?? 10);

  if (!Number.isFinite(olderThanMinutes) || olderThanMinutes < 0) {
    console.error('--older-than-minutes must be a non-negative number');
    process.exit(2);
  }

  if (!isWhishConfigured()) {
    console.error('WHISH_CHANNEL / WHISH_SECRET are not set — nothing to reconcile.');
    process.exit(2);
  }

  const orders = await getUnconfirmedWhishOrders(olderThanMinutes * 60_000);
  console.log(
    `[reconcile] ${orders.length} unconfirmed card order(s) older than ${olderThanMinutes}m` +
      (dryRun ? ' (dry run)' : '')
  );

  const tally = { paid_now: 0, already_paid: 0, not_paid: 0, unavailable: 0 };

  for (const order of orders) {
    if (dryRun) {
      console.log(`  would check ${order.ref} (total ${order.total} ${order.currency})`);
      continue;
    }

    const outcome = await settleWhishOrder(order);
    tally[outcome] += 1;

    // A recovered payment is the whole point of this job — make it loud.
    if (outcome === 'paid_now') {
      console.warn(
        `  RECOVERED ${order.ref}: customer had paid but the callback never landed. ` +
          `Marked paid, confirmation sent.`
      );
    } else {
      console.log(`  ${order.ref}: ${outcome}`);
    }
  }

  if (!dryRun) {
    console.log(
      `[reconcile] done — recovered ${tally.paid_now}, already paid ${tally.already_paid}, ` +
        `genuinely unpaid ${tally.not_paid}, unreachable ${tally.unavailable}`
    );
  }

  // Non-zero so cron mail / monitoring notices that some orders are still unknown.
  if (tally.unavailable > 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error('[reconcile] failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
