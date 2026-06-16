import pg from 'pg';
const pool = new pg.Pool({
  host: 'db.jebixydqpvsegvrtfmgm.supabase.co', port: 5432, database: 'postgres',
  user: 'postgres', password: process.env.SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000,
});

const client = await pool.connect();
try {
  await client.query(`
    UPDATE essence_templates
    SET name = CASE key
          WHEN 'luxury_client_essence' THEN 'Luxury Client Daily Essence'
          WHEN 'wellness_client_essence' THEN 'Wellness Client Daily Essence'
          ELSE name
        END,
        description = CASE key
          WHEN 'luxury_client_essence' THEN 'Daily intelligence briefing for luxury hospitality and concierge clients'
          WHEN 'wellness_client_essence' THEN 'Daily intelligence briefing for wellness and med spa clients'
          ELSE description
        END,
        sections_json = '[{"key":"daily_insights","order":1},{"key":"predictions","order":2},{"key":"rituals","order":3},{"key":"optimizations","order":4}]'::jsonb,
        template_json = '{"version":"1.0","sections":[{"key":"daily_insights","title":"Daily Insights","order":1,"questions":[{"key":"top_opportunity","type":"text","label":"Top client opportunity today"},{"key":"risk_flag","type":"text","label":"Any risk flags"}]},{"key":"predictions","title":"Predictions","order":2,"questions":[]},{"key":"rituals","title":"Daily Rituals","order":3,"questions":[]},{"key":"optimizations","title":"Optimizations","order":4,"questions":[]}],"essence_type":"daily"}',
        updated_at = now()
  `);
  console.log('✅ Updated essence_templates');

  await client.query(`
    UPDATE ris_templates
    SET name = CASE key
          WHEN 'luxury_ris' THEN 'Luxury Resonance Intelligence System'
          WHEN 'beauty_ris' THEN 'Beauty Industry RIS'
          ELSE name
        END,
        description = CASE key
          WHEN 'luxury_ris' THEN 'Resonance intelligence signals for luxury services'
          WHEN 'beauty_ris' THEN 'Resonance intelligence signals for beauty and wellness'
          ELSE description
        END,
        signal_weights_json = '{"purchase_intent":0.3,"satisfaction":0.2,"engagement":0.25,"churn_risk":0.15,"lifetime_value":0.1}'::jsonb,
        updated_at = now()
  `);
  console.log('✅ Updated ris_templates');
  
  console.log('\n🎉 Complete!');
} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  client.release();
  await pool.end();
}
