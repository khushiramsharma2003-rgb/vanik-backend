require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ===== DEALS ENDPOINTS =====

// POST: Log a new deal
app.post('/api/deals', async (req, res) => {
  try {
    const {
      user_id, trade_type, deal_type, date_of_entry, contract_month,
      commodity, quantity, rate, broker, party_name, apmc_mandi,
      port_of_origin, port_of_destination, shipping_terms, address,
      container_number, payment_date, payment_amount, delivery_date, currency
    } = req.body;

    const amount = quantity * rate;
    const balance_to_pay = payment_amount ? (amount - payment_amount) : amount;

    const result = await pool.query(
      `INSERT INTO deals 
       (user_id, trade_type, deal_type, date_of_entry, contract_month, commodity, 
        quantity, rate, amount, broker, party_name, apmc_mandi, port_of_origin, 
        port_of_destination, shipping_terms, address, container_number, 
        payment_date, payment_amount, balance_to_pay, delivery_date, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
       RETURNING *`,
      [user_id, trade_type, deal_type, date_of_entry, contract_month, commodity,
       quantity, rate, amount, broker, party_name, apmc_mandi, port_of_origin,
       port_of_destination, shipping_terms, address, container_number, payment_date,
       payment_amount, balance_to_pay, delivery_date, currency]
    );

    res.json({ success: true, deal: result.rows[0] });
  } catch (error) {
    console.error('Error logging deal:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch all deals for a user
app.get('/api/deals/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM deals WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Reconciliation - matched deals by commodity and contract month
app.get('/api/reconciliation/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await pool.query(
      `SELECT commodity, contract_month, deal_type,
              SUM(quantity) as total_qty, SUM(amount) as total_value
       FROM deals WHERE user_id = $1
       GROUP BY commodity, contract_month, deal_type
       ORDER BY contract_month DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reconciliation:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== PRICES ENDPOINTS =====

// POST: Log a price from scraper
app.post('/api/prices', async (req, res) => {
  try {
    const { source, commodity, contract_month, price, currency } = req.body;
    const result = await pool.query(
      `INSERT INTO prices (source, commodity, contract_month, price, currency)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [source, commodity, contract_month, price, currency || 'INR']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error logging price:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Latest prices for a commodity
app.get('/api/prices/:commodity', async (req, res) => {
  try {
    const { commodity } = req.params;
    const result = await pool.query(
      `SELECT DISTINCT ON (source) source, price, currency, recorded_at
       FROM prices WHERE commodity = $1
       ORDER BY source, recorded_at DESC`,
      [commodity]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== EXCHANGE RATE =====

// POST: Log exchange rate
app.post('/api/exchange-rate', async (req, res) => {
  try {
    const { from_currency, to_currency, rate } = req.body;
    const result = await pool.query(
      `INSERT INTO exchange_rates (from_currency, to_currency, rate)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [from_currency, to_currency, rate]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error logging exchange rate:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Latest USD to INR rate
app.get('/api/exchange-rate/USD/INR', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rate, recorded_at FROM exchange_rates
       WHERE from_currency = 'USD' AND to_currency = 'INR'
       ORDER BY recorded_at DESC LIMIT 1`
    );
    res.json(result.rows[0] || { rate: 84, message: 'Default rate' });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Vanik API is running!', version: '0.1.0' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});