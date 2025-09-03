import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Test basic table creation
const testSchema = async () => {
  console.log('Testing table creation...');
  
  // Test if we can access the database
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1);
    
  console.log('Query result:', { data, error });
  
  // Try to insert test data without the table existing
  const { data: insertData, error: insertError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
    
  console.log('Existing tables:', { insertData, insertError });
};

testSchema().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
