#!/bin/sh
set -eu

for secret in "$POSTGRES_PASSWORD" "$DATABASE_MIGRATOR_PASSWORD" "$DATABASE_APP_PASSWORD"; do
  case "$secret" in
    REPLACE_*|"")
      echo "Database credentials must be generated before starting PostgreSQL." >&2
      exit 1
      ;;
  esac
  if [ "${#secret}" -lt 32 ]; then
    echo "Database credentials must be at least 32 characters." >&2
    exit 1
  fi
done

if [ "$DATABASE_MIGRATOR_PASSWORD" = "$DATABASE_APP_PASSWORD" ]; then
  echo "Migration and application database credentials must be distinct." >&2
  exit 1
fi

psql \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=ON_ERROR_STOP=1 <<'SQL'
\getenv migrator_password DATABASE_MIGRATOR_PASSWORD
\getenv app_password DATABASE_APP_PASSWORD
SELECT format('CREATE ROLE cafe_migrator LOGIN PASSWORD %L', :'migrator_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cafe_migrator')
\gexec
SELECT format('CREATE ROLE cafe_app LOGIN PASSWORD %L', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cafe_app')
\gexec
ALTER DATABASE cafe OWNER TO cafe_migrator;
REVOKE ALL ON DATABASE cafe FROM PUBLIC;
GRANT CONNECT ON DATABASE cafe TO cafe_app;
ALTER SCHEMA public OWNER TO cafe_migrator;
GRANT USAGE ON SCHEMA public TO cafe_app;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM cafe_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cafe_app;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM cafe_app;
ALTER DEFAULT PRIVILEGES FOR ROLE cafe_migrator IN SCHEMA public
  REVOKE INSERT, UPDATE, DELETE ON TABLES FROM cafe_app;
ALTER DEFAULT PRIVILEGES FOR ROLE cafe_migrator IN SCHEMA public
  GRANT SELECT ON TABLES TO cafe_app;
ALTER DEFAULT PRIVILEGES FOR ROLE cafe_migrator IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM cafe_app;
SELECT format('CREATE DATABASE cafe_shadow OWNER cafe_migrator')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'cafe_shadow')
\gexec
\connect cafe_shadow
REVOKE ALL ON DATABASE cafe_shadow FROM PUBLIC;
GRANT CONNECT ON DATABASE cafe_shadow TO cafe_migrator;
ALTER SCHEMA public OWNER TO cafe_migrator;
SQL
