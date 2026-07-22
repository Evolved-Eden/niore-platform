const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-05-27.dahlia' });

async function check() {
  const products = await stripe.products.list({ limit: 30 });
  console.log('Products (' + products.data.length + '):');
  for (const p of products.data) {
    const prices = await stripe.prices.list({ product: p.id, limit: 5 });
    console.log('  ' + p.id + ' | ' + p.name + ' | prices: ' + prices.data.length);
    for (const pr of prices.data) {
      console.log('    ' + pr.id + ' | ' + (pr.unit_amount || 'n/a') + 'c ' + pr.currency + ' | ' + (pr.recurring ? pr.recurring.interval : 'one-time'));
    }
  }
}
check().catch(console.error);
