const {Pool} = require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

const FALLBACKS = {
  'ptsd': 'Healing is possible. We are here.',
  'anxiety': 'Calm begins here.',
  'depression': 'You are not alone.',
  'therapy': 'The journey to better begins with one step.',
  'trauma': 'Trauma-informed care, always.',
  'grief': 'Grief is love with nowhere to go. We hold space.',
  'medication': 'Medication management, simplified.',
  'sober': 'Sobriety, one day at a time.',
  'psychiatric': 'Expert psychiatric care, accessible.',
  'addiction': 'Recovery is a journey. We walk it with you.',
  'detox': 'Detox with dignity.',
  'crisis intervention': 'Immediate help when you need it most.',
  'family addiction': 'Families heal together.',
  'street': 'Street outreach that meets people where they are.',
  'jail': 'Justice-involved support with compassion.',
  'prisoner': 'Reentry support that works.',
  'housing': 'Housing is healthcare.',
  'family reunification': 'Families reunited. Lives rebuilt.',
  'legal defense': 'Your rights, defended.',
  'art market': 'Art markets, intelligently navigated.',
  'visual arts': 'Visual arts, amplified.',
  'dating': 'Dating that leads to connection.',
  'recipe': 'Recipes that delight.',
  'curriculum': 'Curriculum that educates and inspires.',
  'athlete': 'Athlete brands that win.',
  'luxury brand': 'Luxury brands, intelligently managed.',
  'beauty brand': 'Beauty brands that glow.',
  'estate': 'Estates managed with precision.',
  'civic': 'Civic services that serve everyone.',
  'product-market': 'Products that find their market.',
  'executive front': 'Executive presence, automated.',
  'travel concierge': 'Travel that transforms.',
  'legal practice': 'Legal practices that thrive.',
  'media production': 'Media that matters.',
  'events planning': 'Events that create memories.',
  'offer architecture': 'Offers that convert.',
  'deal sourcing': 'Deals that close.',
  'wealth architecture': 'Wealth that endures.',
  'corporate': 'Corporate operations, elevated.',
  'manufacturing': 'Manufacturing optimized.',
  'sustainability': 'Sustainability that scales.',
  'youth development': 'Youth empowered. Futures bright.',
  'early childhood': 'Early years, nurtured.',
  'immigration': 'Immigration pathways, clarified.',
  'veterans': 'Veterans supported. Service honored.',
};

async function main() {
  const agents = await p.query("SELECT agent_id, agent_name, tagline FROM agents ORDER BY agent_id");
  let fixed = 0;
  
  for (const agent of agents.rows) {
    // Skip agents that already have good taglines (not the generic fallback)
    const lcTag = (agent.tagline || '').toLowerCase();
    const lcName = (agent.agent_name || '').toLowerCase();
    
    // Check if it's a fallback tag (contains " for ")
    if (!lcTag.includes(' for ')) continue;
    
    // Find matching fallback
    let newTag = null;
    for (const [key, val] of Object.entries(FALLBACKS)) {
      if (lcName.includes(key)) {
        newTag = val;
        break;
      }
    }
    
    if (!newTag) {
      // Generic fallback by vertical context
      if (lcName.includes('agent')) {
        const nameShort = agent.agent_name.replace(/ Agent$/i, '');
        newTag = `${nameShort} — intelligent automation for your business`;
      } else {
        newTag = `${agent.agent_name} — intelligent automation for your business`;
      }
    }
    
    await p.query('UPDATE agents SET tagline = $1 WHERE agent_id = $2', [newTag, agent.agent_id]);
    console.log(`  ${agent.agent_id}: "${agent.tagline}" → "${newTag}"`);
    fixed++;
  }
  
  console.log(`\nFixed ${fixed} taglines`);
  await p.end();
}

main().catch(e => { console.error(e); process.exit(1); });
