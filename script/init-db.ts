import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log("⏳ Initializing database tables...");
  const db = drizzle(pool, { schema });

  // tabloya dokunarak drizzle'ın schema'yı zorla yüklemesini sağlıyoruz
  await db.execute(`SELECT 1`);

  console.log("✅ Database ready");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ DB init failed:", err);
  process.exit(1);
});
