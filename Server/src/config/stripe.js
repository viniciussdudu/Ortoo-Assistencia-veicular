const Stripe = require('stripe');

// O restante da API deve continuar disponível em desenvolvimento sem Stripe.
module.exports = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
