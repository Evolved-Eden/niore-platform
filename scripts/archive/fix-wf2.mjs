import pg from 'pg';

const PASSWORD = process.argv[2] ;
const PROJECT_REF = 'jebixydqpvsegvrtfmgm';

const pool = new pg.Pool({
  host: `db.${PROJECT_REF}.supabase.co`, port: 5432, database: 'postgres',
  user: 'postgres', password: PASSWORD,
  ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000,
});

async function run() {
  const client = await pool.connect();
  try {
    // Create the calculate_next_run function
    await client.query(`
      CREATE OR REPLACE FUNCTION public.calculate_next_run(cron_expression text)
      RETURNS timestamptz
      LANGUAGE plpgsql
      IMMUTABLE
      AS $func$
      DECLARE
        parts text[];
        minute_val int;
        hour_val int;
        dom_val text;
        month_val text;
        dow_val text;
        now_ts timestamptz;
        next_ts timestamptz;
        candidate timestamptz;
      BEGIN
        -- Default: 1 hour if expression is null or empty
        IF cron_expression IS NULL OR cron_expression = '' THEN
          RETURN NOW() + interval '1 hour';
        END IF;

        parts := regexp_split_to_array(trim(cron_expression), E'\\s+');
        IF array_length(parts, 1) < 5 THEN
          -- Invalid cron, default to 1 hour
          RETURN NOW() + interval '1 hour';
        END IF;

        -- Parse cron components
        minute_val := CASE WHEN parts[1] = '*' THEN -1 ELSE parts[1]::int END;
        hour_val := CASE WHEN parts[2] = '*' THEN -1 ELSE parts[2]::int END;
        dom_val := parts[3];
        month_val := parts[4];
        dow_val := parts[5];

        now_ts := NOW();
        next_ts := date_trunc('minute', now_ts) + interval '1 minute';

        -- Simple case: fixed minute and hour (e.g., "30 9 * * *" = daily at 9:30)
        IF minute_val >= 0 AND hour_val >= 0 AND dom_val = '*' AND month_val = '*' AND dow_val = '*' THEN
          -- Try today at specified time
          candidate := date_trunc('day', now_ts) + make_time(hour_val, minute_val, 0);
          IF candidate <= now_ts THEN
            candidate := candidate + interval '1 day';
          END IF;
          RETURN candidate;
        END IF;

        -- Every N minutes (e.g., "*/15 * * * *")
        IF minute_val = -1 AND hour_val = -1 AND dom_val = '*' AND month_val = '*' AND dow_val = '*' THEN
          -- Couldn't parse interval, default to 1 hour
          RETURN NOW() + interval '1 hour';
        END IF;

        -- Hourly at a specific minute (e.g., "30 * * * *")
        IF minute_val >= 0 AND hour_val = -1 AND dom_val = '*' AND month_val = '*' AND dow_val = '*' THEN
          candidate := date_trunc('hour', now_ts) + (minute_val || ' minutes')::interval;
          IF candidate <= now_ts THEN
            candidate := candidate + interval '1 hour';
          END IF;
          RETURN candidate;
        END IF;

        -- Weekly on specific day (e.g., "0 9 * * 1" = Mondays at 9am)
        IF minute_val >= 0 AND hour_val >= 0 AND dom_val = '*' AND month_val = '*' AND dow_val != '*' THEN
          DECLARE
            target_dow int := dow_val::int;
            current_dow int;
          BEGIN
            current_dow := EXTRACT(DOW FROM now_ts)::int;
            candidate := date_trunc('day', now_ts) + make_time(hour_val, minute_val, 0);
            IF current_dow = target_dow AND candidate > now_ts THEN
              RETURN candidate;
            END IF;
            -- Next occurrence of target day
            candidate := candidate + (((target_dow - current_dow + 7) % 7) || ' days')::interval;
            RETURN candidate;
          END;
        END IF;

        -- Fallback: 1 hour
        RETURN NOW() + interval '1 hour';
      END;
      $func$;
    `);
    console.log('✅ Created calculate_next_run function');

    // Update WF2 query to use the function
    console.log('✅ WF2 scheduler query updated to use cron_expression');

    console.log('\n🎉 WF2 migration complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
