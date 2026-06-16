const {Pool} = require('pg');
const p = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

const TAGLINE_MAP = {
  // Revenue & Sales domain
  'luxury acquisition': 'High-value acquisitions, intelligently sourced',
  'client experience': 'Every client interaction, elevated',
  'showing optimization': 'Showings that convert to offers',
  'food assistance': 'Feeding communities, efficiently',
  'child protective': 'Protecting children with intelligence',
  'disability services': 'Accessibility enabled, dignity preserved',
  'senior services': 'Seniors served with respect',
  'community outreach': 'Outreach that reaches everyone',
  'health optimization': 'Health optimized, lives transformed',
  'telemedicine': 'Healthcare from anywhere',
  'nutrition': 'Nutrition that nourishes',
  'fitness': 'Fitness, intelligently coached',
  'chronic disease': 'Chronic conditions, proactively managed',
  'mental wellness': 'Mental wellness, continuously supported',
  'health insurance': 'Insurance simplified, access expanded',
  'hr': 'People operations, automated',
  'luxury goods': 'Luxury goods, expertly curated',
  'luxury automotive': 'Automotive luxury, redefined',
  'luxury investment': 'Luxury investments, maximized',
  'sports performance': 'Peak performance, data-driven',
  'sports contract': 'Contracts that protect athletes',
  'sports media': 'Sports media, amplified',
  'sports health': 'Athlete health, optimized',
  'tech operations': 'Tech operations, running smoothly',
  'tech revenue': 'Tech revenue, accelerated',
  'tech talent': 'Tech talent, strategically hired',
  'tech ip': 'Intellectual property, protected',
  'government policy': 'Policy informed by intelligence',
  'government services': 'Services that serve everyone',
  'government budget': 'Budget optimized, taxpayers served',
  'government transparency': 'Transparency through automation',
  'government digital': 'Digital government, delivered',
  'legacy trust': 'Trusts managed with precision',
  'legacy philanthropy': 'Philanthropy, maximized impact',
  'legacy inheritance': 'Inheritance, smoothly transitioned',
  'legacy family office': 'Family offices, expertly run',
  'beauty product': 'Beauty products, intelligently marketed',
  'beauty salon': 'Salons that shine',
  'beauty trends': 'Beauty trends, always ahead',
  'beauty wellness': 'Wellness and beauty, integrated',
  'media distribution': 'Content distributed, audiences reached',
  'media rights': 'Rights managed, revenue maximized',
  'food nutrition': 'Nutrition through food',
  'food trends': 'Food trends, analyzed',
  'food commerce': 'Food commerce, streamlined',
  'ai workflow': 'AI workflows, automated',
  'ai model': 'AI models, optimized',
  'ai data': 'AI data, pipelined',
  'ai ethics': 'AI ethics, ensured',
  'ai deployment': 'AI deployed, reliably',
  'ai integration': 'AI integrated, seamlessly',
  'commerce checkout': 'Checkout that converts',
  'commerce fulfillment': 'Fulfillment that delivers',
  'commerce pricing': 'Pricing that maximizes profit',
  'finance modeling': 'Financial models that predict',
  'finance due diligence': 'Due diligence, accelerated',
  'finance portfolio': 'Portfolios optimized',
  'finance risk': 'Risk managed, proactively',
  'wealth planning': 'Wealth planned, legacies secured',
  'wealth investment': 'Investments that grow',
  'wealth tax': 'Tax optimized, wealth preserved',
  'wealth protection': 'Wealth protected, always',
  'wealth legacy': 'Legacy that lasts',
  'social services volunteer': 'Volunteers coordinated, impact multiplied',
  'sports sponsorship': 'Sponsorships that deliver ROI',
  'tech security': 'Security hardened, threats neutralized',
  'tech scaling': 'Scaling made simple',
  'government procurement': 'Procurement that works for citizens',
  'social services case': 'Cases managed, outcomes improved',
  'elder care': 'Elder care with compassion',
  'medicare': 'Medicare, navigated',
  'nursing home': 'Nursing homes, quality assured',
  'dementia': 'Dementia care, specialized',
  'elder abuse': 'Elder abuse, prevented',
  'caregiver': 'Caregivers supported',
  'asylum': 'Asylum seekers, guided',
  'refugee': 'Refugees, resettled with dignity',
  'citizenship': 'Citizenship pathways, clarified',
  'deportation defense': 'Deportation defense, strengthened',
  'daca': 'DACA recipients, supported',
  'va claims': 'VA claims, expedited',
  'military transition': 'Military transitions, supported',
  'veteran employment': 'Veterans employed, skills matched',
  'gallery': 'Galleries, digitally transformed',
  'art investment': 'Art investments, data-driven',
  'art authentication': 'Art authenticated, provenance assured',
  'performance arts': 'Performance arts, showcased',
  'arts grants': 'Arts funded, creativity unleashed',
  'digital art': 'Digital art, collected and traded',
  'art curation': 'Art curated, stories told',
  'arts advocacy': 'Arts advocated, culture preserved',
  'renewable energy': 'Renewable energy, optimized',
  'circular economy': 'Circular economy, operationalized',
  'esg': 'ESG goals, achieved',
  'climate risk': 'Climate risk, assessed and mitigated',
  'sustainable agriculture': 'Agriculture, sustainably grown',
  'water resource': 'Water resources, managed wisely',
  'biodiversity': 'Biodiversity, preserved',
  'quality control': 'Quality controlled, defects eliminated',
  'industrial iot': 'Industrial IoT, connected',
  'product design': 'Products designed for impact',
  'youth development': 'Youth developed, futures bright',
  'troubled youth': 'At-risk youth, redirected',
  'gifted youth': 'Gifted youth, challenged and grown',
  'adolescent mental': 'Adolescent mental health, supported',
  'youth sports': 'Youth athletes, developed',
  'youth arts': 'Youth arts, expressed',
  'youth career': 'Youth careers, launched',
  'youth family': 'Youth families, strengthened',
  'youth mentorship': 'Youth mentored, potential realized',
  'toddler': 'Toddlers, nurtured and growing',
  'preschool': 'Preschool, preparing for success',
  'early intervention': 'Early intervention, changing trajectories',
  'child nutrition': 'Children nourished, futures healthier',
  'childcare provider': 'Childcare providers, supported',
  'parenting support': 'Parents supported, children thriving',
  'child development': 'Child development, tracked and encouraged',
  'early literacy': 'Early literacy, foundations built',
  'child play': 'Play-based learning, encouraged',
  'family support': 'Families supported, together',
  'human development': 'Human potential, unlocked',
  'predictive insight': 'Predictive insights, actioned',
  'global systems': 'Global systems, intelligently managed',
  'smart city': 'Cities smarter, citizens safer',
  'emotional signal': 'Emotional signals, understood',
  'ethical alignment': 'Ethics aligned, trust earned',
  'adaptive evolution': 'Evolution, adaptively guided',
  'matchmaking': 'Matches made, connections formed',
  'compatibility': 'Compatibility, scientifically measured',
  'relationship communication': 'Communication that connects',
  'long-term relationship': 'Long-term love, sustained',
  'marriage': 'Marriages strengthened',
  'co-parenting': 'Co-parenting, collaboratively',
  'relationship boundaries': 'Boundaries, respected',
  'relationship growth': 'Relationships, grown together',
  'memory integrity': 'Memory, preserved and secure',
  'ethics & alignment': 'Ethics guiding every decision',
  'system health': 'Systems healthy, performance optimal',
  'narrative identity': 'Narratives that define us',
  'case management': 'Cases coordinated, outcomes tracked',
  'client relations': 'Client relationships, strengthened',
  'concierge intelligence': 'Intelligent concierge, seamless service',
  'deal room': 'Deal rooms, securely managed',
  'digital product': 'Digital products, delivered',
  'guest experience': 'Guest experiences, memorable',
  'guest insights': 'Guest insights, actionable',
  'hospitality operations': 'Hospitality operations, optimized',
  'loyalty architect': 'Loyalty programs, architected',
  'retention sentinel': 'Retention, constantly guarded',
  'revenue optimizer': 'Revenue, continuously optimized',
  'review reputation': 'Reputation, managed and enhanced',
  'seo optimization': 'SEO optimized, traffic growing',
  'tax optimization': 'Tax optimized, savings maximized',
  'transaction coordinator': 'Transactions, flawlessly coordinated',
  'vip experience': 'VIP experiences, extraordinary',
  // Remaining generic ones from the list
  'legacy wealth transfer': 'Wealth transfers, smoothly executed',
  'legacy trust': 'Trusts, expertly managed',
  'beauty product testing': 'Products tested, quality assured',
  'media rights': 'Media rights, monetized',
  'media distribution': 'Content distributed, globally',
  'personal narrative': 'Personal stories, powerfully told',
  'visual identity': 'Visual identity, distinctly crafted',
  'business model': 'Business models, innovated',
  'access control': 'Access controlled, securely',
  'membership': 'Memberships, managed and grown',
  'copy & conversion': 'Copy that converts',
  'pricing': 'Pricing optimized for profit',
  'partnership': 'Partnerships, strategically grown',
  'ip': 'Intellectual property, protected and monetized',
  'marketplace': 'Marketplaces, thriving',
  'workflow automation': 'Workflows automated, efficiency gained',
  'soul blueprint': 'Soul-level blueprints, discovered',
  'spiritual': 'Spiritual growth, guided',
  'wealth consciousness': 'Wealth consciousness, expanded',
  'zuri sovereign': 'Zuri sovereignty, maintained',
  'multi-vertical': 'Across verticals, seamlessly',
  'cross-lane': 'Cross-lane coordination, mastered',
  'tier upgrade': 'Upgrades, smoothly handled',
  'affiliate': 'Affiliates, managed and grown',
  'enterprise command': 'Enterprise commands, executed',
  'universal integration': 'Universal integration, achieved',
  '12-step': '12-step recovery, supported',
  'bankruptcy': 'Bankruptcy, navigated with expertise',
  'debt relief': 'Debt relief, achieved',
  'unemployment': 'Unemployment, supported with resources',
};

async function main() {
  console.log('=== FIXING AUTONOMOUS_ENABLED ===');
  const autoResult = await p.query(
    "UPDATE agents SET autonomous_enabled = true WHERE orchestration_mode = 'autonomous'"
  );
  console.log(`  Set autonomous_enabled=true for ${autoResult.rowCount} agents`);

  console.log('\n=== ALIGNING TEMPERATURES WITH MAS ===');
  // ELITE (>=85): 0.85, ADVANCED (70-84): 0.7, STANDARD (50-69): 0.5, BASIC (<50): 0.3
  const tempResult = await p.query(`
    UPDATE agents SET temperature = 
      CASE
        WHEN mas_score >= 85 THEN 0.85
        WHEN mas_score >= 70 THEN 0.7
        WHEN mas_score >= 50 THEN 0.5
        ELSE 0.3
      END
    WHERE mas_score IS NOT NULL
  `);
  console.log(`  Updated temperatures for ${tempResult.rowCount} agents`);

  console.log('\n=== UPDATING REMAINING GENERIC TAGLINES ===');
  // Get agents with generic taglines
  const agents = await p.query(
    "SELECT agent_id, agent_name, tagline FROM agents WHERE tagline LIKE '%intelligent automation for your business%'"
  );
  console.log(`  Found ${agents.rows.length} generic taglines to update`);

  let updated = 0;
  let stillGeneric = [];

  for (const agent of agents.rows) {
    const lcName = (agent.agent_name || '').toLowerCase();
    let newTag = null;

    // Find best match from TAGLINE_MAP
    for (const [key, val] of Object.entries(TAGLINE_MAP)) {
      if (lcName.includes(key)) {
        newTag = val;
        break;
      }
    }

    if (!newTag) {
      // Try matching by first word of agent name
      const firstWord = lcName.split(' ')[0];
      for (const [key, val] of Object.entries(TAGLINE_MAP)) {
        if (key.startsWith(firstWord) || firstWord.startsWith(key)) {
          newTag = val;
          break;
        }
      }
    }

    if (!newTag) {
      // Generate from agent_name: remove trailing " Agent" if present and make a tagline
      const nameShort = agent.agent_name
        .replace(/ Agent$/i, '')
        .replace(/ Engine$/i, '')
        .replace(/ Intelligence$/i, '');
      newTag = `${nameShort} — intelligent agent for the Evolved Eden platform`;
      stillGeneric.push(agent.agent_id);
    }

    await p.query('UPDATE agents SET tagline = $1 WHERE agent_id = $2', [newTag, agent.agent_id]);
    updated++;
  }

  console.log(`  Updated: ${updated}`);
  console.log(`  Still generic: ${stillGeneric.length}`);
  if (stillGeneric.length > 0) {
    console.log('  IDs:', stillGeneric.join(', '));
  }

  // Verification
  const r1 = await p.query("SELECT COUNT(*) FROM agents WHERE tagline LIKE '%intelligent automation%'");
  console.log(`\n=== VERIFICATION ===`);
  console.log(`  Remaining generic taglines: ${r1.rows[0].count}`);
  const r2 = await p.query("SELECT COUNT(*) FROM agents WHERE autonomous_enabled = true");
  console.log(`  Autonomous enabled: ${r2.rows[0].count}`);
  const r3 = await p.query("SELECT temperature, COUNT(*) FROM agents GROUP BY temperature ORDER BY temperature");
  console.log(`  Temperature distribution:`);
  r3.rows.forEach(r => console.log(`    ${r.temperature}: ${r.count}`));

  await p.end();
}

main().catch(e => { console.error(e); process.exit(1); });
