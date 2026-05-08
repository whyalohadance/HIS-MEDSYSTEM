#!/bin/bash
set -e

echo "Creating demo data for HIS-MedSystem presentation"
echo ""

API="http://localhost:3000/api"

# Get admin token
TOKEN=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@med.com","password":"password123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

if [ -z "$TOKEN" ]; then
  echo "ERROR: Could not get token. Make sure the backend is running."
  exit 1
fi

echo "Token received"

# Get staff IDs
DOCTOR_ID=$(curl -s $API/users -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
docs=[u['id'] for u in d.get('data',[]) if u.get('role')=='doctor']
print(docs[0] if docs else 0)
")
RADIOLOGIST_ID=$(curl -s $API/users -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
rads=[u['id'] for u in d.get('data',[]) if u.get('role')=='radiologist']
print(rads[0] if rads else 0)
")
LAB_ID=$(curl -s $API/users -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
labs=[u['id'] for u in d.get('data',[]) if u.get('role')=='lab_technician']
print(labs[0] if labs else 0)
")

echo "Staff: Doctor=$DOCTOR_ID, Radiologist=$RADIOLOGIST_ID, Lab=$LAB_ID"

# 1. PATIENTS
echo ""
echo "Creating patients..."

create_patient() {
  local FNAME=$1 LNAME=$2 DOB=$3 GENDER=$4 PHONE=$5 EMAIL=$6 ADDR=$7
  RESULT=$(curl -s -X POST $API/patients \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"firstName\": \"$FNAME\",
      \"lastName\": \"$LNAME\",
      \"dateOfBirth\": \"$DOB\",
      \"gender\": \"$GENDER\",
      \"phone\": \"$PHONE\",
      \"email\": \"$EMAIL\",
      \"address\": \"$ADDR\"
    }")
  echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id','?'))" 2>/dev/null
}

P1=$(create_patient "Ion" "Popescu" "1985-03-15" "male" "+37368111111" "ion.popescu@mail.md" "Bd. Stefan cel Mare 100, Chisinau")
echo "  Patient 1: Ion Popescu (ID=$P1)"
P2=$(create_patient "Maria" "Ionescu" "1990-07-22" "female" "+37368222222" "maria.ionescu@mail.md" "Str. Negruzzi 25, Chisinau")
echo "  Patient 2: Maria Ionescu (ID=$P2)"
P3=$(create_patient "Andrei" "Cebotari" "1978-11-03" "male" "+37368333333" "andrei.c@mail.md" "Bd. Dacia 15, Chisinau")
echo "  Patient 3: Andrei Cebotari (ID=$P3)"
P4=$(create_patient "Elena" "Munteanu" "1995-05-18" "female" "+37368444444" "elena.m@mail.md" "Str. Bucuresti 50, Chisinau")
echo "  Patient 4: Elena Munteanu (ID=$P4)"
P5=$(create_patient "Vasile" "Stefan" "1965-01-30" "male" "+37368555555" "vasile.s@mail.md" "Bd. Mircea 20, Chisinau")
echo "  Patient 5: Vasile Stefan (ID=$P5)"
P6=$(create_patient "Anna" "Rotaru" "2000-09-12" "female" "+37368666666" "anna.r@mail.md" "Str. Mihai Viteazu 7, Chisinau")
echo "  Patient 6: Anna Rotaru (ID=$P6)"
P7=$(create_patient "Mihai" "Cojocaru" "1982-04-25" "male" "+37368777777" "mihai.c@mail.md" "Bd. Cantemir 35, Chisinau")
echo "  Patient 7: Mihai Cojocaru (ID=$P7)"
P8=$(create_patient "Olga" "Botezatu" "1988-12-08" "female" "+37368888888" "olga.b@mail.md" "Str. Vlaicu Pircalab 12, Chisinau")
echo "  Patient 8: Olga Botezatu (ID=$P8)"
P9=$(create_patient "Sergiu" "Doroftei" "1973-06-14" "male" "+37368999999" "sergiu.d@mail.md" "Bd. Renasterii 88, Chisinau")
echo "  Patient 9: Sergiu Doroftei (ID=$P9)"
P10=$(create_patient "Cristina" "Bivol" "1992-02-28" "female" "+37368000111" "cristina.b@mail.md" "Str. Ion Creanga 45, Chisinau")
echo "  Patient 10: Cristina Bivol (ID=$P10)"

# 2. Get room IDs
echo ""
echo "Fetching rooms..."
CONSULT_ROOM=$(curl -s $API/rooms -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
rs=[r for r in d.get('data',[]) if r.get('type')=='consultation']
print(rs[0]['id'] if rs else 1)
")
RAD_ROOM=$(curl -s $API/rooms -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
rs=[r for r in d.get('data',[]) if r.get('type')=='radiology']
print(rs[0]['id'] if rs else 1)
")
LAB_ROOM=$(curl -s $API/rooms -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
rs=[r for r in d.get('data',[]) if r.get('type')=='laboratory']
print(rs[0]['id'] if rs else 1)
")
echo "Rooms: Consultation=$CONSULT_ROOM, Radiology=$RAD_ROOM, Lab=$LAB_ROOM"

# 3. APPOINTMENTS
echo ""
echo "Creating appointments..."

TODAY=$(date +%Y-%m-%d)
TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d '+1 day' +%Y-%m-%d)
WEEK_AGO=$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d '-7 days' +%Y-%m-%d)
TWO_WEEKS_AGO=$(date -v-14d +%Y-%m-%d 2>/dev/null || date -d '-14 days' +%Y-%m-%d)
MONTH_AGO=$(date -v-30d +%Y-%m-%d 2>/dev/null || date -d '-30 days' +%Y-%m-%d)

create_appointment() {
  local PATIENT_ID=$1 DOCTOR_ID=$2 ROOM_ID=$3 DATE=$4 TIME=$5 DURATION=$6 PRICE=$7 EXAM=$8 STATUS=$9
  curl -s -X POST $API/appointments \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"patientId\": $PATIENT_ID,
      \"doctorId\": $DOCTOR_ID,
      \"roomId\": $ROOM_ID,
      \"date\": \"$DATE\",
      \"time\": \"$TIME\",
      \"duration\": $DURATION,
      \"price\": $PRICE,
      \"examination\": \"$EXAM\",
      \"status\": \"$STATUS\"
    }" > /dev/null
}

# Past completed appointments (2 weeks ago)
create_appointment $P1 $DOCTOR_ID $CONSULT_ROOM $TWO_WEEKS_AGO "09:00" 30 250 "Первичный приём" "completed"
echo "  Completed: Ion Popescu 2 weeks ago 09:00"
create_appointment $P2 $DOCTOR_ID $CONSULT_ROOM $TWO_WEEKS_AGO "09:30" 30 250 "Первичный приём" "completed"
echo "  Completed: Maria Ionescu 2 weeks ago 09:30"
create_appointment $P3 $DOCTOR_ID $CONSULT_ROOM $TWO_WEEKS_AGO "10:00" 30 200 "Повторный приём" "completed"
echo "  Completed: Andrei Cebotari 2 weeks ago 10:00"

# Past completed appointments (1 week ago)
create_appointment $P4 $DOCTOR_ID $CONSULT_ROOM $WEEK_AGO "09:00" 30 250 "Первичный приём" "completed"
echo "  Completed: Elena Munteanu last week 09:00"
create_appointment $P5 $DOCTOR_ID $CONSULT_ROOM $WEEK_AGO "10:00" 45 300 "Консультация кардиолога" "completed"
echo "  Completed: Vasile Stefan last week 10:00"
create_appointment $P1 $RADIOLOGIST_ID $RAD_ROOM $WEEK_AGO "11:00" 45 1200 "МРТ головного мозга" "completed"
echo "  Completed: Ion Popescu MRI last week"

# Month ago
create_appointment $P6 $DOCTOR_ID $CONSULT_ROOM $MONTH_AGO "14:00" 30 250 "Первичный приём" "completed"
echo "  Completed: Anna Rotaru 1 month ago"
create_appointment $P7 $DOCTOR_ID $CONSULT_ROOM $MONTH_AGO "15:00" 30 200 "Повторный приём" "completed"
echo "  Completed: Mihai Cojocaru 1 month ago"

# Today's appointments (scheduled)
create_appointment $P1 $DOCTOR_ID $CONSULT_ROOM $TODAY "09:00" 30 250 "Плановый осмотр" "scheduled"
echo "  Today: Ion Popescu 09:00"
create_appointment $P8 $DOCTOR_ID $CONSULT_ROOM $TODAY "10:00" 30 250 "Первичный приём" "scheduled"
echo "  Today: Olga Botezatu 10:00"
create_appointment $P9 $DOCTOR_ID $CONSULT_ROOM $TODAY "11:00" 45 300 "Консультация терапевта" "scheduled"
echo "  Today: Sergiu Doroftei 11:00"
create_appointment $P2 $RADIOLOGIST_ID $RAD_ROOM $TODAY "14:00" 45 1200 "МРТ головного мозга" "scheduled"
echo "  Today: Maria Ionescu MRI 14:00"
create_appointment $P3 $LAB_ID $LAB_ROOM $TODAY "08:30" 15 250 "Биохимия крови" "scheduled"
echo "  Today: Andrei Cebotari lab 08:30"

# Tomorrow's appointments
create_appointment $P10 $DOCTOR_ID $CONSULT_ROOM $TOMORROW "10:00" 30 250 "Первичный приём" "scheduled"
echo "  Tomorrow: Cristina Bivol 10:00"
create_appointment $P4 $DOCTOR_ID $CONSULT_ROOM $TOMORROW "11:30" 30 200 "Повторный приём" "scheduled"
echo "  Tomorrow: Elena Munteanu 11:30"
create_appointment $P5 $RADIOLOGIST_ID $RAD_ROOM $TOMORROW "14:00" 60 1500 "МРТ позвоночника" "scheduled"
echo "  Tomorrow: Vasile Stefan MRI spine 14:00"

echo ""
echo "DONE! Statistics:"
curl -s $API/patients -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print('  Patients:', len(json.load(sys.stdin).get('data', [])))"
curl -s $API/appointments -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print('  Appointments:', len(json.load(sys.stdin).get('data', [])))"
curl -s $API/rooms -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print('  Rooms:', len(json.load(sys.stdin).get('data', [])))"

echo ""
echo "Ready for demo! Open http://localhost"
echo ""
echo "Accounts:"
echo "  admin@med.com / password123 — full access"
echo "  doctor@med.com / password123 — appointments"
echo "  reception@med.com / password123 — scheduling"
echo "  radiolog@med.com / password123 — MRI worklist"
echo "  lab@med.com / password123 — lab worklist"
