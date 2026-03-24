import { Pool } from 'pg';

const POSTGRES_URL = process.env.POSTGRES_URL ||
  'postgres://1ff19df6cb44817ca148bb108099dfaf4fd21bd0d5c7e1adc088809858518db4:sk_e6oCVg0pIlbrxGHZBNcdZ@db.prisma.io:5432/postgres?sslmode=require';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: POSTGRES_URL, max: 5 });
  }
  return pool;
}

export async function query(text: string, params?: unknown[]) {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
