#!/bin/bash
set -e

API="http://localhost:3000/api"

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║   🎬 HIS-MedSystem — Полная Demo Загрузка    ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Получение токена
TOKEN=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@med.com","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Backend не отвечает. Проверь docker-compose ps"
  exit 1
fi
echo "✅ Авторизация админа"

# Получаем IDs персонала
DOCTOR_ID=$(curl -s $API/users -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print([u['id'] for u in d.get('data',[]) if u.get('role')=='doctor'][0])")
RADIOLOGIST_ID=$(curl -s $API/users -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print([u['id'] for u in d.get('data',[]) if u.get('role')=='radiologist'][0])")
LAB_ID=$(curl -s $API/users -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print([u['id'] for u in d.get('data',[]) if u.get('role')=='lab_technician'][0])")

echo "📋 Персонал: Doctor=$DOCTOR_ID | Radiologist=$RADIOLOGIST_ID | Lab=$LAB_ID"
echo ""

# Даты для приёмов
TODAY=$(date +%Y-%m-%d)
TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d '+1 day' +%Y-%m-%d)
DAY_AFTER=$(date -v+2d +%Y-%m-%d 2>/dev/null || date -d '+2 days' +%Y-%m-%d)
YESTERDAY=$(date -v-1d +%Y-%m-%d 2>/dev/null || date -d '-1 day' +%Y-%m-%d)
WEEK_AGO=$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d '-7 days' +%Y-%m-%d)
TWO_WEEKS_AGO=$(date -v-14d +%Y-%m-%d 2>/dev/null || date -d '-14 days' +%Y-%m-%d)
MONTH_AGO=$(date -v-30d +%Y-%m-%d 2>/dev/null || date -d '-30 days' +%Y-%m-%d)

# ════════════════════════════════════════════
# 1. ПАЦИЕНТЫ
# ════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👥 1. ПАЦИЕНТЫ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

EXISTING=$(curl -s $API/patients -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data', [])))")
echo "Существует пациентов: $EXISTING"

if [ "$EXISTING" -lt "10" ]; then
  PATIENTS=(
    "Ion|Popescu|1985-03-15|male|+37368111111|ion.popescu@mail.md|Bd. Stefan cel Mare 100, Chisinau|A+"
    "Maria|Ionescu|1990-07-22|female|+37368222222|maria.ionescu@mail.md|Str. Negruzzi 25, Chisinau|O+"
    "Andrei|Cebotari|1978-11-03|male|+37368333333|andrei.c@mail.md|Bd. Dacia 15, Chisinau|B+"
    "Elena|Munteanu|1995-05-18|female|+37368444444|elena.m@mail.md|Str. Bucuresti 50, Chisinau|AB+"
    "Vasile|Stefan|1965-01-30|male|+37368555555|vasile.s@mail.md|Bd. Mircea 20, Chisinau|A-"
    "Anna|Rotaru|2000-09-12|female|+37368666666|anna.r@mail.md|Str. Mihai Viteazu 7, Chisinau|O+"
    "Mihai|Cojocaru|1982-04-25|male|+37368777777|mihai.c@mail.md|Bd. Cantemir 35, Chisinau|B-"
    "Olga|Botezatu|1988-12-08|female|+37368888888|olga.b@mail.md|Str. Vlaicu Pircalab 12, Chisinau|A+"
    "Sergiu|Doroftei|1973-06-14|male|+37368999999|sergiu.d@mail.md|Bd. Renasterii 88, Chisinau|O-"
    "Cristina|Bivol|1992-02-28|female|+37368000000|cristina.b@mail.md|Str. Ion Creanga 45, Chisinau|AB-"
    "Vladimir|Ciobanu|1958-08-20|male|+37369111222|vladimir.c@mail.md|Str. Tighina 5, Chisinau|A+"
    "Natalia|Lungu|1996-11-15|female|+37369222333|natalia.l@mail.md|Bd. Constantin Brancusi 10, Chisinau|B+"
  )

  for p in "${PATIENTS[@]}"; do
    IFS='|' read -ra P <<< "$p"
    curl -s -X POST $API/patients \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"firstName\":\"${P[0]}\",\"lastName\":\"${P[1]}\",\"dateOfBirth\":\"${P[2]}\",\"gender\":\"${P[3]}\",\"phone\":\"${P[4]}\",\"email\":\"${P[5]}\",\"address\":\"${P[6]}\",\"bloodType\":\"${P[7]}\"}" > /dev/null
    echo "  ✅ ${P[0]} ${P[1]}"
  done
else
  echo "  ℹ️  Достаточно пациентов, пропускаем"
fi

# Получаем реальные ID пациентов из БД
PATIENT_IDS=$(curl -s $API/patients -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin).get('data',[])
ids=[str(p['id']) for p in sorted(d, key=lambda x: x['id'])[:12]]
print(' '.join(ids))
")
read -ra PID_ARR <<< "$PATIENT_IDS"
P1=${PID_ARR[0]:-1}; P2=${PID_ARR[1]:-2}; P3=${PID_ARR[2]:-3}
P4=${PID_ARR[3]:-4}; P5=${PID_ARR[4]:-5}; P6=${PID_ARR[5]:-6}
P7=${PID_ARR[6]:-7}; P8=${PID_ARR[7]:-8}; P9=${PID_ARR[8]:-9}

echo "Используем пациентов: $P1 $P2 $P3 $P4 $P5 $P6 $P7 $P8 $P9"

# ════════════════════════════════════════════
# 2. КАБИНЕТЫ
# ════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏥 2. КАБИНЕТЫ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ROOMS_COUNT=$(curl -s $API/rooms -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data', [])))")
echo "Существует кабинетов: $ROOMS_COUNT"

if [ "$ROOMS_COUNT" -lt "3" ]; then
  # 1. Терапевт
  curl -s -X POST $API/rooms \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"number\":\"101\",\"name\":\"Кабинет терапевта\",\"type\":\"consultation\",\"floor\":1,\"isActive\":true,\"assignedDoctorIds\":[$DOCTOR_ID],\"services\":[{\"name\":\"Первичный приём\",\"price\":250,\"duration\":30},{\"name\":\"Повторный приём\",\"price\":150,\"duration\":20},{\"name\":\"Консультация\",\"price\":200,\"duration\":25}]}" > /dev/null
  echo "  ✅ № 101 — Кабинет терапевта"

  # 2. Радиология
  curl -s -X POST $API/rooms \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"number\":\"205\",\"name\":\"Радиология (МРТ/КТ)\",\"type\":\"radiology\",\"floor\":2,\"isActive\":true,\"assignedDoctorIds\":[$RADIOLOGIST_ID],\"services\":[{\"name\":\"МРТ головного мозга\",\"price\":1200,\"duration\":45},{\"name\":\"МРТ позвоночника\",\"price\":1500,\"duration\":60},{\"name\":\"КТ грудной клетки\",\"price\":800,\"duration\":30},{\"name\":\"Рентген\",\"price\":250,\"duration\":15},{\"name\":\"УЗИ органов\",\"price\":350,\"duration\":30}]}" > /dev/null
  echo "  ✅ № 205 — Радиология"

  # 3. Лаборатория
  curl -s -X POST $API/rooms \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"number\":\"305\",\"name\":\"Лаборатория\",\"type\":\"laboratory\",\"floor\":3,\"isActive\":true,\"assignedDoctorIds\":[$LAB_ID],\"services\":[{\"name\":\"Общий анализ крови\",\"price\":150,\"duration\":15},{\"name\":\"Биохимия крови\",\"price\":250,\"duration\":15},{\"name\":\"Анализ мочи\",\"price\":80,\"duration\":10},{\"name\":\"Гормоны щитовидной\",\"price\":350,\"duration\":15},{\"name\":\"Глюкоза крови\",\"price\":50,\"duration\":10}]}" > /dev/null
  echo "  ✅ № 305 — Лаборатория"
else
  echo "  ℹ️  Кабинеты уже есть"
fi

# Получаем IDs кабинетов
CONSULT_ROOM=$(curl -s $API/rooms -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); rs=[r for r in d.get('data',[]) if r.get('type')=='consultation']; print(rs[0]['id'] if rs else 1)")
RAD_ROOM=$(curl -s $API/rooms -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); rs=[r for r in d.get('data',[]) if r.get('type')=='radiology']; print(rs[0]['id'] if rs else 1)")
LAB_ROOM=$(curl -s $API/rooms -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); rs=[r for r in d.get('data',[]) if r.get('type')=='laboratory']; print(rs[0]['id'] if rs else 1)")

echo "Кабинеты: Consult=$CONSULT_ROOM | Rad=$RAD_ROOM | Lab=$LAB_ROOM"

# ════════════════════════════════════════════
# 3. КАТАЛОГ ТЕСТОВ
# ════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 3. КАТАЛОГ ТЕСТОВ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TESTS_COUNT=$(curl -s $API/lab/tests -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null || echo "0")
echo "Существует тестов: $TESTS_COUNT"

if [ "$TESTS_COUNT" -lt "10" ]; then

  # ГЕМАТОЛОГИЯ
  curl -s -X POST $API/lab/tests \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Общий анализ крови","code":"CBC","category":"hematology","price":150,"turnaroundTime":4,"sampleType":"blood","description":"Полный анализ крови с лейкоформулой","isActive":true,"parameters":[{"name":"Гемоглобин","unit":"г/л","refMin":120,"refMax":160},{"name":"Эритроциты","unit":"10^12/л","refMin":3.8,"refMax":5.5},{"name":"Лейкоциты","unit":"10^9/л","refMin":4,"refMax":9},{"name":"Тромбоциты","unit":"10^9/л","refMin":150,"refMax":400}]}' > /dev/null
  echo "  ✅ CBC — Общий анализ крови"

  curl -s -X POST $API/lab/tests \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"СОЭ","code":"ESR","category":"hematology","price":50,"turnaroundTime":2,"sampleType":"blood","description":"Скорость оседания эритроцитов","isActive":true,"parameters":[{"name":"СОЭ","unit":"мм/ч","refMin":0,"refMax":15}]}' > /dev/null
  echo "  ✅ ESR — СОЭ"

  # БИОХИМИЯ
  curl -s -X POST $API/lab/tests \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Биохимия крови","code":"CHEM","category":"biochemistry","price":250,"turnaroundTime":6,"sampleType":"blood","description":"Базовая биохимическая панель","isActive":true,"parameters":[{"name":"Глюкоза","unit":"ммоль/л","refMin":3.3,"refMax":6.1},{"name":"Креатинин","unit":"мкмоль/л","refMin":62,"refMax":115},{"name":"Мочевина","unit":"ммоль/л","refMin":2.5,"refMax":7.5},{"name":"Холестерин общий","unit":"ммоль/л","refMin":3,"refMax":5.2},{"name":"АЛТ","unit":"Ед/л","refMin":0,"refMax":41},{"name":"АСТ","unit":"Ед/л","refMin":0,"refMax":40}]}' > /dev/null
  echo "  ✅ CHEM — Биохимия крови"

  curl -s -X POST $API/lab/tests \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Глюкоза","code":"GLU","category":"biochemistry","price":50,"turnaroundTime":2,"sampleType":"blood","description":"Глюкоза в крови натощак","isActive":true,"parameters":[{"name":"Глюкоза","unit":"ммоль/л","refMin":3.3,"refMax":6.1}]}' > /dev/null
  echo "  ✅ GLU — Глюкоза"

  curl -s -X POST $API/lab/tests \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Липидный профиль","code":"LIPID","category":"biochemistry","price":300,"turnaroundTime":6,"sampleType":"blood","description":"Холестерин и его фракции","isActive":true,"parameters":[{"name":"Холестерин общий","unit":"ммоль/л","refMin":3,"refMax":5.2},{"name":"ЛПВП","unit":"ммоль/л","refMin":1.04,"refMax":1.55},{"name":"ЛПНП","unit":"ммоль/л","refMin":1.5,"refMax":3.4},{"name":"Триглицериды","unit":"ммоль/л","refMin":0.45,"refMax":1.7}]}' > /dev/null
  echo "  ✅ LIPID — Липидный профиль"

  # АНАЛИЗ МОЧИ
  curl -s -X POST $API/lab/tests \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Общий анализ мочи","code":"UA","category":"urine","price":80,"turnaroundTime":3,"sampleType":"urine","description":"Общий клинический анализ мочи","isActive":true,"parameters":[{"name":"pH","unit":"","refMin":5,"refMax":7},{"name":"Удельный вес","unit":"","refMin":1.005,"refMax":1.030},{"name":"Белок","unit":"г/л","refMin":0,"refMax":0.033},{"name":"Лейкоциты в моче","unit":"в п/з","refMin":0,"refMax":5}]}' > /dev/null
  echo "  ✅ UA — Общий анализ мочи"

  # ГОРМОНЫ
  curl -s -X POST $API/lab/tests \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"ТТГ","code":"TSH","category":"hormones","price":180,"turnaroundTime":24,"sampleType":"blood","description":"Тиреотропный гормон","isActive":true,"parameters":[{"name":"ТТГ","unit":"мМЕ/л","refMin":0.27,"refMax":4.2}]}' > /dev/null
  echo "  ✅ TSH — ТТГ"

  curl -s -X POST $API/lab/tests \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Гормоны щитовидной","code":"THYR","category":"hormones","price":350,"turnaroundTime":24,"sampleType":"blood","description":"ТТГ + Т4 свободный + Т3","isActive":true,"parameters":[{"name":"ТТГ","unit":"мМЕ/л","refMin":0.27,"refMax":4.2},{"name":"Т4 свободный","unit":"пмоль/л","refMin":12,"refMax":22},{"name":"Т3 свободный","unit":"пмоль/л","refMin":3.1,"refMax":6.8}]}' > /dev/null
  echo "  ✅ THYR — Гормоны щитовидной"

  curl -s -X POST $API/lab/tests \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Кортизол","code":"CORT","category":"hormones","price":200,"turnaroundTime":12,"sampleType":"blood","description":"Гормон стресса","isActive":true,"parameters":[{"name":"Кортизол","unit":"нмоль/л","refMin":171,"refMax":536}]}' > /dev/null
  echo "  ✅ CORT — Кортизол"

  # ИММУНОЛОГИЯ
  curl -s -X POST $API/lab/tests \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"С-реактивный белок","code":"CRP","category":"immunology","price":120,"turnaroundTime":4,"sampleType":"blood","description":"Маркер воспаления","isActive":true,"parameters":[{"name":"СРБ","unit":"мг/л","refMin":0,"refMax":5}]}' > /dev/null
  echo "  ✅ CRP — С-реактивный белок"

  # КОАГУЛЯЦИЯ
  curl -s -X POST $API/lab/tests \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Коагулограмма","code":"COAG","category":"coagulation","price":280,"turnaroundTime":6,"sampleType":"blood","description":"Свёртываемость крови","isActive":true,"parameters":[{"name":"Протромбиновое время","unit":"сек","refMin":11,"refMax":16},{"name":"МНО","unit":"","refMin":0.85,"refMax":1.15},{"name":"АЧТВ","unit":"сек","refMin":21,"refMax":35},{"name":"Фибриноген","unit":"г/л","refMin":2,"refMax":4}]}' > /dev/null
  echo "  ✅ COAG — Коагулограмма"

  # КАРДИОМАРКЕРЫ
  curl -s -X POST $API/lab/tests \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Тропонин I","code":"TNI","category":"cardiac","price":250,"turnaroundTime":2,"sampleType":"blood","description":"Маркер инфаркта миокарда","isActive":true,"parameters":[{"name":"Тропонин I","unit":"нг/мл","refMin":0,"refMax":0.04}]}' > /dev/null
  echo "  ✅ TNI — Тропонин I"

  curl -s -X POST $API/lab/tests \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"D-димер","code":"DDIM","category":"cardiac","price":300,"turnaroundTime":4,"sampleType":"blood","description":"Маркер тромбоза","isActive":true,"parameters":[{"name":"D-димер","unit":"мкг/мл","refMin":0,"refMax":0.5}]}' > /dev/null
  echo "  ✅ DDIM — D-димер"

  # МИКРОБИОЛОГИЯ
  curl -s -X POST $API/lab/tests \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Посев мочи","code":"UCUL","category":"microbiology","price":200,"turnaroundTime":72,"sampleType":"urine","description":"Бакпосев мочи на флору","isActive":true,"parameters":[{"name":"КОЕ/мл","unit":"КОЕ/мл","refMin":0,"refMax":1000}]}' > /dev/null
  echo "  ✅ UCUL — Посев мочи"

else
  echo "  ℹ️  Тесты уже есть"
fi

# Получаем IDs тестов
TEST_CBC=$(curl -s $API/lab/tests -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; ts=[t for t in json.load(sys.stdin).get('data',[]) if t.get('code')=='CBC']; print(ts[0]['id'] if ts else 1)")
TEST_GLU=$(curl -s $API/lab/tests -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; ts=[t for t in json.load(sys.stdin).get('data',[]) if t.get('code')=='GLU']; print(ts[0]['id'] if ts else 1)")
TEST_CHEM=$(curl -s $API/lab/tests -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; ts=[t for t in json.load(sys.stdin).get('data',[]) if t.get('code')=='CHEM']; print(ts[0]['id'] if ts else 1)")
TEST_TSH=$(curl -s $API/lab/tests -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; ts=[t for t in json.load(sys.stdin).get('data',[]) if t.get('code')=='TSH']; print(ts[0]['id'] if ts else 1)")
TEST_CRP=$(curl -s $API/lab/tests -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; ts=[t for t in json.load(sys.stdin).get('data',[]) if t.get('code')=='CRP']; print(ts[0]['id'] if ts else 1)")
TEST_LIPID=$(curl -s $API/lab/tests -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; ts=[t for t in json.load(sys.stdin).get('data',[]) if t.get('code')=='LIPID']; print(ts[0]['id'] if ts else 1)")
TEST_UA=$(curl -s $API/lab/tests -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; ts=[t for t in json.load(sys.stdin).get('data',[]) if t.get('code')=='UA']; print(ts[0]['id'] if ts else 1)")
TEST_COAG=$(curl -s $API/lab/tests -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; ts=[t for t in json.load(sys.stdin).get('data',[]) if t.get('code')=='COAG']; print(ts[0]['id'] if ts else 1)")

echo "Тесты: CBC=$TEST_CBC | GLU=$TEST_GLU | CHEM=$TEST_CHEM | TSH=$TEST_TSH"

# ════════════════════════════════════════════
# 4. ПРИЁМЫ (РАСПИСАНИЕ)
# ════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📅 4. РАСПИСАНИЕ ПРИЁМОВ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

APPTS_COUNT=$(curl -s $API/appointments -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null || echo "0")
echo "Существует приёмов: $APPTS_COUNT"

if [ "$APPTS_COUNT" -lt "10" ]; then
  # Прошлые приёмы (completed) — для статистики и истории
  echo "📜 Прошлые приёмы (completed)..."
  PAST_PATIENTS=($P1 $P2 $P3 $P4 $P5)
  HOURS=(9 10 11 14 15)
  for idx in 0 1 2 3 4; do
    PID=${PAST_PATIENTS[$idx]}
    HOUR=${HOURS[$idx]}
    curl -s -X POST $API/appointments \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"patientId\":$PID,\"doctorId\":$DOCTOR_ID,\"roomId\":$CONSULT_ROOM,\"date\":\"$WEEK_AGO\",\"time\":\"$(printf '%02d' $HOUR):00\",\"duration\":30,\"price\":250,\"examination\":\"Первичный приём\",\"status\":\"completed\",\"notes\":\"Жалобы на головную боль\",\"diagnosis\":\"Мигрень\",\"treatment\":\"Анальгетики, режим\"}" > /dev/null
    echo "  ✅ Пациент $PID — $WEEK_AGO $(printf '%02d' $HOUR):00 (completed)"
  done

  # Две недели назад
  for PID in $P6 $P7 $P8; do
    curl -s -X POST $API/appointments \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"patientId\":$PID,\"doctorId\":$DOCTOR_ID,\"roomId\":$CONSULT_ROOM,\"date\":\"$TWO_WEEKS_AGO\",\"time\":\"10:30\",\"duration\":30,\"price\":200,\"examination\":\"Повторный приём\",\"status\":\"completed\",\"notes\":\"Контрольный осмотр\",\"diagnosis\":\"Состояние стабильное\",\"treatment\":\"Продолжать лечение\"}" > /dev/null
    echo "  ✅ Пациент $PID — $TWO_WEEKS_AGO 10:30 (completed)"
  done

  # Сегодняшние приёмы
  echo ""
  echo "🟢 Сегодняшние приёмы..."
  TODAY_PATIENTS=($P1 $P2 $P3 $P4)
  TODAY_HOURS=(9 11 13 15)
  for idx in 0 1 2 3; do
    PID=${TODAY_PATIENTS[$idx]}
    HOUR=${TODAY_HOURS[$idx]}
    curl -s -X POST $API/appointments \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"patientId\":$PID,\"doctorId\":$DOCTOR_ID,\"roomId\":$CONSULT_ROOM,\"date\":\"$TODAY\",\"time\":\"$(printf '%02d' $HOUR):00\",\"duration\":30,\"price\":250,\"examination\":\"Первичный приём\",\"status\":\"scheduled\"}" > /dev/null
    echo "  ✅ Пациент $PID — $TODAY $(printf '%02d' $HOUR):00 (scheduled)"
  done

  # Завтрашние приёмы
  echo ""
  echo "🔵 Завтрашние приёмы..."
  TMR_PATIENTS=($P5 $P6 $P7)
  TMR_HOURS=(9 11 13)
  for idx in 0 1 2; do
    PID=${TMR_PATIENTS[$idx]}
    HOUR=${TMR_HOURS[$idx]}
    curl -s -X POST $API/appointments \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"patientId\":$PID,\"doctorId\":$DOCTOR_ID,\"roomId\":$CONSULT_ROOM,\"date\":\"$TOMORROW\",\"time\":\"$(printf '%02d' $HOUR):30\",\"duration\":30,\"price\":200,\"examination\":\"Консультация\",\"status\":\"scheduled\"}" > /dev/null
    echo "  ✅ Пациент $PID — $TOMORROW $(printf '%02d' $HOUR):30"
  done

  # Послезавтра
  echo ""
  echo "🟣 Послезавтра..."
  for PID in $P8 $P9; do
    curl -s -X POST $API/appointments \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"patientId\":$PID,\"doctorId\":$DOCTOR_ID,\"roomId\":$CONSULT_ROOM,\"date\":\"$DAY_AFTER\",\"time\":\"11:00\",\"duration\":30,\"price\":150,\"examination\":\"Повторный приём\",\"status\":\"scheduled\"}" > /dev/null
    echo "  ✅ Пациент $PID — $DAY_AFTER 11:00"
  done
else
  echo "  ℹ️  Приёмы уже есть ($APPTS_COUNT)"
fi

# ════════════════════════════════════════════
# 5. РАДИОЛОГИЧЕСКИЕ ИССЛЕДОВАНИЯ
# ════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📷 5. РАДИОЛОГИЧЕСКИЕ ИССЛЕДОВАНИЯ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STUDIES_COUNT=$(curl -s $API/studies -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null || echo "0")
echo "Существует исследований: $STUDIES_COUNT"

if [ "$STUDIES_COUNT" -lt "5" ]; then
  # Приёмы в radiology кабинет — backend авто-создаст Study
  RAD_EXAMS_PIDS=($P1 $P2 $P3 $P4 $P5 $P6)
  RAD_EXAMS_NAMES=("МРТ головного мозга" "МРТ позвоночника" "КТ грудной клетки" "Рентген" "УЗИ органов" "МРТ головного мозга")
  RAD_EXAMS_PRICES=(1200 1500 800 250 350 1200)
  RAD_EXAMS_DURS=(45 60 30 15 30 45)

  for idx in 0 1 2 3 4 5; do
    PID=${RAD_EXAMS_PIDS[$idx]}
    NAME=${RAD_EXAMS_NAMES[$idx]}
    PRICE=${RAD_EXAMS_PRICES[$idx]}
    DUR=${RAD_EXAMS_DURS[$idx]}
    HOUR=$((10 + idx))
    curl -s -X POST $API/appointments \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"patientId\":$PID,\"doctorId\":$RADIOLOGIST_ID,\"roomId\":$RAD_ROOM,\"date\":\"$TODAY\",\"time\":\"$(printf '%02d' $HOUR):00\",\"duration\":$DUR,\"price\":$PRICE,\"examination\":\"$NAME\",\"status\":\"scheduled\",\"notes\":\"Жалобы на боли\"}" > /dev/null
    echo "  ✅ Пациент $PID — $NAME ($PRICE MDL)"
  done

  # Прошлые радиологические — для истории
  for PID in $P1 $P2; do
    curl -s -X POST $API/appointments \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"patientId\":$PID,\"doctorId\":$RADIOLOGIST_ID,\"roomId\":$RAD_ROOM,\"date\":\"$WEEK_AGO\",\"time\":\"14:00\",\"duration\":45,\"price\":1200,\"examination\":\"МРТ головного мозга\",\"status\":\"completed\"}" > /dev/null
    echo "  ✅ Пациент $PID — МРТ (прошлая неделя, completed)"
  done
else
  echo "  ℹ️  Исследования уже есть ($STUDIES_COUNT)"
fi

# ════════════════════════════════════════════
# 6. ЛАБОРАТОРНЫЕ ЗАКАЗЫ
# ════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔬 6. ЛАБОРАТОРНЫЕ ЗАКАЗЫ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ORDERS_COUNT=$(curl -s $API/lab/orders -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null || echo "0")
echo "Существует заказов: $ORDERS_COUNT"

if [ "$ORDERS_COUNT" -lt "5" ]; then
  # Приёмы в lab кабинет — backend авто-создаст LabOrder
  LAB_EXAM_PIDS=($P1 $P2 $P3 $P4 $P5 $P6 $P7)
  LAB_EXAM_NAMES=("Общий анализ крови" "Биохимия крови" "Глюкоза" "Гормоны щитовидной" "Анализ мочи" "Общий анализ крови" "Биохимия крови")
  LAB_EXAM_PRICES=(150 250 50 350 80 150 250)

  for idx in 0 1 2 3 4 5 6; do
    PID=${LAB_EXAM_PIDS[$idx]}
    NAME=${LAB_EXAM_NAMES[$idx]}
    PRICE=${LAB_EXAM_PRICES[$idx]}
    HOUR=$((8 + idx))
    curl -s -X POST $API/appointments \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"patientId\":$PID,\"roomId\":$LAB_ROOM,\"date\":\"$TODAY\",\"time\":\"$(printf '%02d' $HOUR):00\",\"duration\":15,\"price\":$PRICE,\"examination\":\"$NAME\",\"status\":\"scheduled\"}" > /dev/null
    echo "  ✅ Пациент $PID — $NAME ($PRICE MDL)"
  done

  # Прямые лаб-заказы с разными приоритетами
  echo ""
  echo "🔬 Прямые лаб-заказы (urgent/stat/routine)..."

  curl -s -X POST $API/lab/orders \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"patientId\":$P1,\"testId\":$TEST_CBC,\"priority\":\"urgent\",\"clinicalInfo\":\"Подозрение на анемию\"}" > /dev/null
  echo "  ✅ CBC для пациента $P1 (urgent)"

  curl -s -X POST $API/lab/orders \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"patientId\":$P3,\"testId\":$TEST_GLU,\"priority\":\"stat\",\"clinicalInfo\":\"Сахарный диабет, контроль\"}" > /dev/null
  echo "  ✅ GLU для пациента $P3 (stat)"

  curl -s -X POST $API/lab/orders \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"patientId\":$P5,\"testId\":$TEST_TSH,\"priority\":\"routine\",\"clinicalInfo\":\"Профилактический осмотр\"}" > /dev/null
  echo "  ✅ TSH для пациента $P5 (routine)"

  curl -s -X POST $API/lab/orders \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"patientId\":$P2,\"testId\":$TEST_CHEM,\"priority\":\"urgent\",\"clinicalInfo\":\"Боли в правом подреберье\"}" > /dev/null
  echo "  ✅ CHEM для пациента $P2 (urgent)"

  curl -s -X POST $API/lab/orders \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"patientId\":$P4,\"testId\":$TEST_CRP,\"priority\":\"routine\",\"clinicalInfo\":\"Подозрение на воспалительный процесс\"}" > /dev/null
  echo "  ✅ CRP для пациента $P4 (routine)"

  curl -s -X POST $API/lab/orders \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"patientId\":$P6,\"testId\":$TEST_LIPID,\"priority\":\"routine\",\"clinicalInfo\":\"Кардиологический скрининг\"}" > /dev/null
  echo "  ✅ LIPID для пациента $P6 (routine)"

  curl -s -X POST $API/lab/orders \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"patientId\":$P7,\"testId\":$TEST_UA,\"priority\":\"routine\",\"clinicalInfo\":\"Нефрологический осмотр\"}" > /dev/null
  echo "  ✅ UA для пациента $P7 (routine)"

  curl -s -X POST $API/lab/orders \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"patientId\":$P8,\"testId\":$TEST_COAG,\"priority\":\"urgent\",\"clinicalInfo\":\"Предоперационное обследование\"}" > /dev/null
  echo "  ✅ COAG для пациента $P8 (urgent)"
else
  echo "  ℹ️  Заказы уже есть ($ORDERS_COUNT)"
fi

# ════════════════════════════════════════════
# 7. ИТОГИ
# ════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════"
echo "✅ ЗАГРУЗКА ЗАВЕРШЕНА!"
echo "═══════════════════════════════════════════"
echo ""

PATS=$(curl -s $API/patients -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data', [])))")
ROOMS=$(curl -s $API/rooms -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data', [])))")
TESTS=$(curl -s $API/lab/tests -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data', [])))")
APPTS=$(curl -s $API/appointments -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data', [])))")
ORDERS=$(curl -s $API/lab/orders -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null || echo "?")
STUDIES=$(curl -s $API/studies -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null || echo "?")

echo "📊 СТАТИСТИКА БД:"
echo "   👥 Пациентов:      $PATS"
echo "   🏥 Кабинетов:      $ROOMS"
echo "   🧪 Тестов:         $TESTS"
echo "   📅 Приёмов:        $APPTS"
echo "   🔬 Лаб-заказов:    $ORDERS"
echo "   📷 Исследований:   $STUDIES"
echo ""
echo "🌐 Открой http://localhost"
echo ""
echo "👤 Тестируй под разными ролями (пароль: password123):"
echo "   admin@med.com       — видит всё"
echo "   doctor@med.com      — свои приёмы и пациенты"
echo "   reception@med.com   — расписание + создание приёмов"
echo "   radiolog@med.com    — RIS worklist с МРТ/КТ/УЗИ"
echo "   lab@med.com         — LIS worklist с анализами"
echo ""
echo "🚀 Готово к презентации!"
