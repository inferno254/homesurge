const { Client } = require('pg');

const userId = '2551b947-2793-42f4-b224-b06271578795';

const client = new Client({
  connectionString: 'postgresql://postgres:Markofathena12@db.vxhsftwixqepzxvctsvp.supabase.co:5432/postgres'
});

client.connect()
  .then(() => {
    console.log('Connected');
    return client.query(
      'INSERT INTO public.profiles (id, role) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET role = $2',
      [userId, 'admin']
    );
  })
  .then(result => {
    console.log('Rows affected:', result.rowCount);
    return client.query('SELECT id, role FROM public.profiles WHERE id = $1', [userId]);
  })
  .then(result => {
    console.log('Profile:', result.rows);
    client.end();
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
