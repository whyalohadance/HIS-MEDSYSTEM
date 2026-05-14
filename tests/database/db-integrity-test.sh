#!/bin/bash
set -e

DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "postgres|db|database" | head -1)
DB_USER=$(grep "POSTGRES_USER" docker-compose.yml | head -1 | awk -F':-' '{print $2}' | tr -d '"' | tr -d ' ' | tr -d '}')
DB_NAME=$(grep "POSTGRES_DB" docker-compose.yml | head -1 | awk -F':-' '{print $2}' | tr -d '"' | tr -d ' ' | tr -d '}')

DB_USER=${DB_USER:-medical_user}
DB_NAME=${DB_NAME:-medical_db}

echo "═══════════════════════════════════════════"
echo "💾 DATABASE INTEGRITY TESTS"
echo "═══════════════════════════════════════════"
echo "Container: $DB_CONTAINER"
echo "User: $DB_USER, DB: $DB_NAME"
echo ""

run_sql() {
  docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -A -c "$1" 2>/dev/null
}

run_sql_table() {
  docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "$1" 2>/dev/null
}

# ═══════════════════════════════════════════════
echo "══ 1. ТАБЛИЦЫ ══"
TABLES=$(run_sql "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;")
echo "Найденные таблицы:"
echo "$TABLES" | sed 's/^/  • /'

EXPECTED_TABLES="patients users appointments rooms studies lab_tests lab_orders notifications"
for t in $EXPECTED_TABLES; do
  EXISTS=$(run_sql "SELECT COUNT(*) FROM pg_tables WHERE tablename='$t';")
  if [ "$EXISTS" = "1" ]; then
    echo "  ✅ Таблица $t существует"
  else
    echo "  ⚠️  Таблица $t отсутствует"
  fi
done

# ═══════════════════════════════════════════════
echo ""
echo "══ 2. КОЛИЧЕСТВО ЗАПИСЕЙ ══"
ALL_TABLES=$(run_sql "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;")
for t in $ALL_TABLES; do
  COUNT=$(run_sql "SELECT COUNT(*) FROM \"$t\";")
  echo "  📊 $t: $COUNT записей"
done

# ═══════════════════════════════════════════════
echo ""
echo "══ 3. FOREIGN KEYS ══"
FKS=$(run_sql "
SELECT
    tc.table_name || '.' || kcu.column_name || ' → ' || ccu.table_name || '.' || ccu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name;
")

FK_COUNT=$(echo "$FKS" | grep -c "→" || echo "0")
echo "Найдено FK связей: $FK_COUNT"

if [ -n "$FKS" ]; then
  echo "FK связи:"
  echo "$FKS" | sed 's/^/  🔗 /'
else
  echo "  ⚠️  FOREIGN KEYS НЕ НАЙДЕНЫ — целостность только на уровне приложения"
fi

# ═══════════════════════════════════════════════
echo ""
echo "══ 4. ORPHAN ЗАПИСИ ══"

# Appointments с несуществующими пациентами
ORPHAN_APT=$(run_sql "
SELECT COUNT(*) FROM appointments a
WHERE NOT EXISTS (SELECT 1 FROM patients p WHERE p.id = a.\"patientId\");
" 2>/dev/null || echo "?")
[ "$ORPHAN_APT" = "0" ] && echo "  ✅ Appointments без пациентов: 0" || echo "  ❌ Appointments без пациентов: $ORPHAN_APT"

# Studies без пациента
ORPHAN_STUDIES=$(run_sql "
SELECT COUNT(*) FROM studies s
WHERE NOT EXISTS (SELECT 1 FROM patients p WHERE p.id = s.\"patientId\");
" 2>/dev/null || echo "?")
[ "$ORPHAN_STUDIES" = "0" ] && echo "  ✅ Studies без пациентов: 0" || echo "  ❌ Studies без пациентов: $ORPHAN_STUDIES"

# Lab orders без пациентов
ORPHAN_LAB=$(run_sql "
SELECT COUNT(*) FROM lab_orders lo
WHERE NOT EXISTS (SELECT 1 FROM patients p WHERE p.id = lo.\"patientId\");
" 2>/dev/null || echo "?")
[ "$ORPHAN_LAB" = "0" ] && echo "  ✅ Lab orders без пациентов: 0" || echo "  ❌ Lab orders без пациентов: $ORPHAN_LAB"

# Appointments с несуществующими докторами
ORPHAN_DOC=$(run_sql "
SELECT COUNT(*) FROM appointments a
WHERE a.\"doctorId\" IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = a.\"doctorId\");
" 2>/dev/null || echo "?")
[ "$ORPHAN_DOC" = "0" ] && echo "  ✅ Appointments без докторов: 0" || echo "  ❌ Appointments без докторов: $ORPHAN_DOC"

# Lab orders без lab_tests
ORPHAN_LAB_TEST=$(run_sql "
SELECT COUNT(*) FROM lab_orders lo
WHERE NOT EXISTS (SELECT 1 FROM lab_tests lt WHERE lt.id = lo.\"testId\");
" 2>/dev/null || echo "?")
[ "$ORPHAN_LAB_TEST" = "0" ] && echo "  ✅ Lab orders без lab_tests: 0" || echo "  ❌ Lab orders без lab_tests: $ORPHAN_LAB_TEST"

# Notifications без user
ORPHAN_NOTIF=$(run_sql "
SELECT COUNT(*) FROM notifications n
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = n.\"userId\");
" 2>/dev/null || echo "?")
[ "$ORPHAN_NOTIF" = "0" ] && echo "  ✅ Notifications без users: 0" || echo "  ❌ Notifications без users: $ORPHAN_NOTIF"

# ═══════════════════════════════════════════════
echo ""
echo "══ 5. ИНДЕКСЫ ══"
INDEXES=$(run_sql "
SELECT schemaname||'.'||tablename||'.'||indexname
FROM pg_indexes
WHERE schemaname='public'
ORDER BY tablename, indexname;
")

INDEX_COUNT=$(echo "$INDEXES" | grep -c "\." || echo "0")
echo "Всего индексов: $INDEX_COUNT"
echo ""
echo "Полный список:"
echo "$INDEXES" | sed 's/^/  📌 /'

echo ""
echo "Ключевые индексы (проверка):"
for combo in "appointments:date" "appointments:patientId" "appointments:doctorId" "appointments:status" "lab_orders:patientId" "lab_orders:status" "studies:patientId" "users:email" "users:role"; do
  TABLE=$(echo $combo | cut -d: -f1)
  COL=$(echo $combo | cut -d: -f2)
  HAS=$(run_sql "
    SELECT COUNT(*) FROM pg_indexes
    WHERE schemaname='public' AND tablename='$TABLE'
    AND indexdef ILIKE '%$COL%';
  ")
  if [ "$HAS" -gt "0" ] 2>/dev/null; then
    echo "  ✅ $TABLE.$COL — индекс есть"
  else
    echo "  ⚠️  $TABLE.$COL — нет индекса (медленные запросы!)"
  fi
done

# ═══════════════════════════════════════════════
echo ""
echo "══ 6. РАЗМЕР ТАБЛИЦ ══"
echo "Топ-10 по размеру:"
run_sql_table "
SELECT
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS data_size,
    n_live_tup AS rows
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;
"

# ═══════════════════════════════════════════════
echo ""
echo "══ 7. КАЧЕСТВО ДАННЫХ ══"

NO_EMAIL=$(run_sql "SELECT COUNT(*) FROM patients WHERE email IS NULL OR email = '';")
echo "  Пациенты без email: $NO_EMAIL"

NO_DOB=$(run_sql "SELECT COUNT(*) FROM patients WHERE \"dateOfBirth\" IS NULL;")
echo "  Пациенты без даты рождения: $NO_DOB"

ACTIVE=$(run_sql "SELECT COUNT(*) FROM users WHERE \"isActive\" = true;")
INACTIVE=$(run_sql "SELECT COUNT(*) FROM users WHERE \"isActive\" = false;")
echo "  Активных пользователей: $ACTIVE"
echo "  Деактивированных: $INACTIVE"

echo ""
echo "  Распределение приёмов по статусам:"
run_sql_table "SELECT status, COUNT(*) as count FROM appointments GROUP BY status ORDER BY count DESC;"

echo ""
echo "  Распределение ролей пользователей:"
run_sql_table "SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC;"

UNREAD=$(run_sql "SELECT COUNT(*) FROM notifications WHERE \"isRead\" = false;" 2>/dev/null || echo "?")
echo "  Непрочитанных уведомлений: $UNREAD"

# Lab orders by status
echo ""
echo "  Lab orders по статусам:"
run_sql_table "SELECT status, COUNT(*) as count FROM lab_orders GROUP BY status ORDER BY count DESC;" 2>/dev/null || echo "  (таблица не найдена)"

# ═══════════════════════════════════════════════
echo ""
echo "══ 8. ПРОВЕРКА УНИКАЛЬНОСТИ ══"

DUP_EMAIL_USERS=$(run_sql "
SELECT COUNT(*) FROM (
  SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1
) AS t;
")
[ "$DUP_EMAIL_USERS" = "0" ] && echo "  ✅ Дубликаты email в users: 0" || echo "  ❌ Дубликаты email в users: $DUP_EMAIL_USERS — нужен UNIQUE constraint!"

DUP_EMAIL_PAT=$(run_sql "
SELECT COUNT(*) FROM (
  SELECT email FROM patients WHERE email IS NOT NULL AND email != ''
  GROUP BY email HAVING COUNT(*) > 1
) AS t;
")
[ "$DUP_EMAIL_PAT" = "0" ] && echo "  ✅ Дубликаты email в patients: 0" || echo "  ❌ Дубликаты email в patients: $DUP_EMAIL_PAT"

# Дублирующиеся приёмы (один пациент, один доктор, одна дата+время)
DUP_APT=$(run_sql "
SELECT COUNT(*) FROM (
  SELECT \"patientId\", \"doctorId\", date, time
  FROM appointments
  GROUP BY \"patientId\", \"doctorId\", date, time
  HAVING COUNT(*) > 1
) AS t;
")
[ "$DUP_APT" = "0" ] && echo "  ✅ Дублирующихся приёмов: 0" || echo "  ⚠️  Дублирующихся приёмов: $DUP_APT"

# ═══════════════════════════════════════════════
echo ""
echo "══ 9. КАСКАДНЫЕ УДАЛЕНИЯ ══"

CASCADE_INFO=$(run_sql "
SELECT
    tc.table_name || '.' || kcu.column_name AS source,
    rc.delete_rule AS on_delete,
    rc.update_rule AS on_update
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public'
ORDER BY tc.table_name;
")

if [ -n "$CASCADE_INFO" ]; then
  echo "Правила каскадного удаления:"
  echo "$CASCADE_INFO" | sed 's/^/  /'
else
  echo "  ⚠️  Нет FK → каскадных удалений нет (TypeORM synchronize не создал FK)"
fi

# ═══════════════════════════════════════════════
echo ""
echo "══ 10. ENUM ТИПЫ ══"
ENUMS=$(run_sql "
SELECT t.typname || ': ' || string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder)
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
GROUP BY t.typname
ORDER BY t.typname;
")
if [ -n "$ENUMS" ]; then
  echo "Найденные ENUM типы:"
  echo "$ENUMS" | sed 's/^/  📌 /'
else
  echo "  ℹ️  ENUM типов не найдено (TypeORM использует varchar для enum)"
fi

# ═══════════════════════════════════════════════
echo ""
echo "══ 11. ПОСЛЕДНЯЯ АКТИВНОСТЬ ══"
run_sql_table "
SELECT
    'patients' AS table_name,
    MAX(\"createdAt\") AS last_created
FROM patients
UNION ALL
SELECT
    'appointments',
    MAX(\"createdAt\")
FROM appointments
UNION ALL
SELECT
    'studies',
    MAX(\"createdAt\")
FROM studies
UNION ALL
SELECT
    'lab_orders',
    MAX(\"createdAt\")
FROM lab_orders
ORDER BY last_created DESC NULLS LAST;
"

# ═══════════════════════════════════════════════
echo ""
echo "══ 12. CHECK CONSTRAINTS ══"
CHECKS=$(run_sql "
SELECT tc.table_name || ': ' || tc.constraint_name
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'CHECK' AND tc.table_schema = 'public'
ORDER BY tc.table_name;
")
if [ -n "$CHECKS" ]; then
  echo "CHECK constraints:"
  echo "$CHECKS" | sed 's/^/  ✅ /'
else
  echo "  ℹ️  CHECK constraints отсутствуют"
fi

# ═══════════════════════════════════════════════
echo ""
echo "══ 13. NULLABLE COLUMNS АНАЛИЗ ══"
echo "Nullable колонки в ключевых таблицах:"
run_sql_table "
SELECT table_name, column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('patients','appointments','users','lab_orders','studies')
  AND is_nullable = 'YES'
  AND column_name NOT IN ('id','createdAt','updatedAt','deletedAt','email','address','city','country','notes','description','conclusion','metadata')
ORDER BY table_name, column_name
LIMIT 30;
"

echo ""
echo "═══════════════════════════════════════════"
echo "✅ ТЕСТ ЗАВЕРШЁН"
echo "═══════════════════════════════════════════"
