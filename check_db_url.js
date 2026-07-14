const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Need the postgres connection string. Supabase URL usually gives the REST API URL.
// Since the user might not have set NEXT_PUBLIC_SUPABASE_URL as a database connection string,
// let's check if there's a DATABASE_URL. If not, I can just tell the user to run a query in Supabase.
console.log(process.env.DATABASE_URL);
