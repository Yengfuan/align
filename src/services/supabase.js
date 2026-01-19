import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qqkaowchizgilmgwktxr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxa2Fvd2NoaXpnaWxtZ3drdHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDYyODIsImV4cCI6MjA4NDI4MjI4Mn0.zU4UAi4YBnXVfGRxo4NwYVMTWyzlOoFyVjrML6xmv9g';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
