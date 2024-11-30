import { Client } from 'pg';

// Connect to default `postgres` database first
const adminString = 'postgresql://temporal:temporal@postgresql:5432/postgres';

// Isolate from temporal database by creating our own (hotmesh)
const dbName = 'hotmesh';
export const connectionString = `postgresql://temporal:temporal@postgresql:5432/${dbName}`;

// Standard client object (in production, we would use a connection pool)
export const connection = {
  class: Client,
  options: { connectionString },
};

// Truncate all tables in all user-defined schemas
export const truncateTables = async (): Promise<void> => {
  const postgresClient = new Client({ connectionString });

  try {
    await postgresClient.connect();

    // Log the current database for debugging
    const currentDBResult = await postgresClient.query(
      'SELECT current_database();',
    );
    // console.log(
    //   'Connected to database:',
    //   currentDBResult.rows[0].current_database,
    // );

    // Log available schemas for debugging
    const schemasResult = await postgresClient.query(`
      SELECT schema_name
      FROM information_schema.schemata;
    `);
    // console.log(
    //   'Available schemas:',
    //   schemasResult.rows.map((row) => row.schema_name),
    // );

    await postgresClient.query('BEGIN');

    // Explicitly target 'meshflow' schema (the patterns all target this namespace)
    const schemas = ['meshflow', 'public'];

    const tablesResult = await postgresClient.query(
      `
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema = ANY ($1::text[]);
      `,
      [schemas],
    );

    const tables = tablesResult.rows.map(
      (row: { table_schema: string; table_name: string }) =>
        `"${row.table_schema}"."${row.table_name}"`,
    );

    if (tables.length > 0) {
      // console.log(
      //   `Truncating tables in schemas: ${schemas.join(', ')}, tables: ${tables.join(', ')}`,
      // );
      await postgresClient.query(
        `TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE;`,
      );
    } else {
      //console.log(`No tables found in schemas: ${schemas.join(', ')}`);
    }

    await postgresClient.query('COMMIT');
  } catch (error) {
    await postgresClient.query('ROLLBACK');
    console.error('Error during table truncation:', error);
    throw error;
  } finally {
    await postgresClient.end();
  }
};

/**
 * Check if the database exists and create it if it doesn't.
 * Ensure the `temporal` user has the required privileges on the database.
 */
export const createAndTruncateDatabase = async (bTruncate = false) => {
  let client: Client | null = null;
  let hotmeshClient: Client | null = null;

  try {
    // Connect to the default 'postgres' database as admin
    client = new Client({
      connectionString: adminString,
    });
    await client.connect();

    // Check if the 'hotmesh' database exists
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName],
    );
    if (res.rowCount === 0) {
      // Create the 'hotmesh' database if it doesn't exist
      await client.query(`CREATE DATABASE ${dbName}`);
    }

    // Close the connection to the 'postgres' database
    await client.end();
    client = null; // Avoid double-closing in the finally block

    // Connect to the 'hotmesh' database to set privileges
    hotmeshClient = new Client({
      connectionString: `postgresql://temporal:temporal@postgresql:5432/${dbName}`,
    });
    await hotmeshClient.connect();

    // Ensure 'temporal' user has privileges in 'hotmesh'
    await hotmeshClient.query(
      `GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO temporal`,
    );
    await hotmeshClient.query(
      `GRANT ALL ON ALL TABLES IN SCHEMA public TO temporal`,
    );
    await hotmeshClient.query(
      `GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO temporal`,
    );
    await hotmeshClient.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO temporal`,
    );

    // If you have specific schemas (like 'meshflow'), grant privileges there as well
    await hotmeshClient.query(`GRANT ALL ON SCHEMA meshflow TO temporal`);
    await hotmeshClient.query(
      `GRANT ALL ON ALL TABLES IN SCHEMA meshflow TO temporal`,
    );
    await hotmeshClient.query(
      `GRANT ALL ON ALL SEQUENCES IN SCHEMA meshflow TO temporal`,
    );
    await hotmeshClient.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA meshflow GRANT ALL ON TABLES TO temporal`,
    );

    // console.log(
    //   `Privileges granted to user 'temporal' on database '${dbName}'.`,
    // );
  } catch (err) {
    console.error(
      'Error while checking/creating database or setting privileges:',
      err,
    );
  } finally {
    // Ensure all clients are properly closed
    if (client) {
      await client.end().catch((e) => console.error('Error closing client', e));
    }
    if (hotmeshClient) {
      await hotmeshClient
        .end()
        .catch((e) => console.error('Error closing hotmeshClient', e));
    }
    if (bTruncate) {
      // Truncate tables after ensuring privileges are correctly set
      await truncateTables();
    }
  }
};
