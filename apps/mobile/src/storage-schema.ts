export const SCHEMA = `PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rights(project TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,pattern TEXT NOT NULL,event TEXT UNIQUE NOT NULL,PRIMARY KEY(project,pattern));
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
PRAGMA user_version=1;`;
export const SAVE_PROJECT =
  "INSERT INTO projects VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data";
export const GRANT_PATTERN = "INSERT OR IGNORE INTO rights VALUES(?,?,?)";
export const COPY_RIGHTS =
  "INSERT INTO rights SELECT ?,pattern,? || pattern FROM rights WHERE project=?";
