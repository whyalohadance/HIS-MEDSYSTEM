-- ============================================================================
-- HIS-MedSystem — Date demo pentru dashboard impresionant
-- Rulare: docker exec -i his_postgres psql -U medical_user -d medical_db < demo-data.sql
-- ============================================================================

-- ⚠️ CERINȚE:
--   1. Setup Wizard finalizat (admin user creat, id=1)
--   2. lab-tests-catalog.sql rulat în prealabil (30 lab_tests)
--   3. Containers: healthy (docker-compose ps)

-- Parola 'Demo1234' (bcrypt cost 12)
-- Toți utilizatorii demo folosesc același hash

-- ============================================================================
-- 1. ANGAJAȚI (12 persoane, id 2-13)
-- ============================================================================

INSERT INTO users ("firstName", "lastName", email, password, role, phone, specialization, "isActive") VALUES
-- Medici (id 2-6)
('Maria',    'Popescu',    'maria.popescu@cdg.md',    '$2a$12$LQjxX6cKxQXJZw5L1k0LZeY3pK8nXmZ9cWGhVxN8mLqV3wHkP5jWS', 'doctor',         '+373 22 555-111', 'Cardiologie',        true),
('Petru',    'Ionescu',    'petru.ionescu@cdg.md',    '$2a$12$LQjxX6cKxQXJZw5L1k0LZeY3pK8nXmZ9cWGhVxN8mLqV3wHkP5jWS', 'doctor',         '+373 22 555-112', 'Endocrinologie',     true),
('Ana',      'Georgescu',  'ana.georgescu@cdg.md',    '$2a$12$LQjxX6cKxQXJZw5L1k0LZeY3pK8nXmZ9cWGhVxN8mLqV3wHkP5jWS', 'doctor',         '+373 22 555-113', 'Gastroenterologie',  true),
('Vasile',   'Munteanu',   'vasile.munteanu@cdg.md',  '$2a$12$LQjxX6cKxQXJZw5L1k0LZeY3pK8nXmZ9cWGhVxN8mLqV3wHkP5jWS', 'doctor',         '+373 22 555-114', 'Neurologie',         true),
('Elena',    'Stoica',     'elena.stoica@cdg.md',     '$2a$12$LQjxX6cKxQXJZw5L1k0LZeY3pK8nXmZ9cWGhVxN8mLqV3wHkP5jWS', 'doctor',         '+373 22 555-115', 'Medicină internă',   true),
-- Recepționiste (id 7-8)
('Cristina', 'Lupu',       'cristina.lupu@cdg.md',    '$2a$12$LQjxX6cKxQXJZw5L1k0LZeY3pK8nXmZ9cWGhVxN8mLqV3wHkP5jWS', 'receptionist',   '+373 22 555-200', 'Recepție',           true),
('Mihaela',  'Vasilescu',  'mihaela.vasilescu@cdg.md','$2a$12$LQjxX6cKxQXJZw5L1k0LZeY3pK8nXmZ9cWGhVxN8mLqV3wHkP5jWS', 'receptionist',   '+373 22 555-201', 'Recepție',           true),
-- Radiologi (id 9-10)
('Andrei',   'Costin',     'andrei.costin@cdg.md',    '$2a$12$LQjxX6cKxQXJZw5L1k0LZeY3pK8nXmZ9cWGhVxN8mLqV3wHkP5jWS', 'radiologist',    '+373 22 555-300', 'Radiologie',         true),
('Diana',    'Marinescu',  'diana.marinescu@cdg.md',  '$2a$12$LQjxX6cKxQXJZw5L1k0LZeY3pK8nXmZ9cWGhVxN8mLqV3wHkP5jWS', 'radiologist',    '+373 22 555-301', 'Radiologie',         true),
-- Laboranți (id 11-13)
('Sergiu',   'Pavel',      'sergiu.pavel@cdg.md',     '$2a$12$LQjxX6cKxQXJZw5L1k0LZeY3pK8nXmZ9cWGhVxN8mLqV3wHkP5jWS', 'lab_technician', '+373 22 555-400', 'Hematologie',        true),
('Natalia',  'Rusu',       'natalia.rusu@cdg.md',     '$2a$12$LQjxX6cKxQXJZw5L1k0LZeY3pK8nXmZ9cWGhVxN8mLqV3wHkP5jWS', 'lab_technician', '+373 22 555-401', 'Biochimie',          true),
('Igor',     'Cazacu',     'igor.cazacu@cdg.md',      '$2a$12$LQjxX6cKxQXJZw5L1k0LZeY3pK8nXmZ9cWGhVxN8mLqV3wHkP5jWS', 'lab_technician', '+373 22 555-402', 'Hormoni',            true);

-- ============================================================================
-- 2. CABINETE (10 cabinete cu tipuri corecte)
-- ============================================================================

INSERT INTO rooms (name, number, type, floor, "isActive", description) VALUES
('Cabinet Cardiologie',      '101', 'consultation', 1, true, 'Consultații cardiologice'),
('Cabinet Endocrinologie',   '102', 'consultation', 1, true, 'Consultații endocrinologice'),
('Cabinet Gastroenterologie','103', 'consultation', 1, true, 'Consultații gastroenterologice'),
('Cabinet Neurologie',       '104', 'consultation', 1, true, 'Consultații neurologice'),
('Cabinet Medicină Internă', '105', 'consultation', 1, true, 'Medicină internă'),
('Sală procedurală 1',       '201', 'procedure',    2, true, 'Proceduri medicale'),
('Sală procedurală 2',       '202', 'procedure',    2, true, 'Proceduri medicale'),
('Tomograf CT',              '301', 'radiology',    3, true, 'Tomograf computerizat'),
('Rezonanță Magnetică MRI',  '302', 'radiology',    3, true, 'Rezonanță magnetică'),
('Laborator central',        '401', 'laboratory',   4, true, 'Analize medicale');

-- ============================================================================
-- 3. PACIENȚI (60 persoane)
-- ============================================================================

INSERT INTO patients ("firstName", "lastName", "dateOfBirth", gender, phone, email, address, city, country, "doctorId") VALUES
-- Batch 1 — Moldoveni (10)
('Ion',        'Popescu',    '1985-03-15', 'male',   '+373 22 100-001', 'ion.popescu@gmail.com',    'Str. Ștefan cel Mare 100, ap. 25', 'Chișinău', 'Moldova', 2),
('Maria',      'Ionescu',    '1990-07-22', 'female', '+373 22 100-002', 'maria.ionescu@yahoo.com',  'Bdul Dacia 45',                    'Chișinău', 'Moldova', 2),
('Vasile',     'Munteanu',   '1978-11-30', 'male',   '+373 22 100-003', NULL,                       'Str. Vasile Alecsandri 12',        'Chișinău', 'Moldova', 3),
('Ana',        'Lazăr',      '1995-05-18', 'female', '+373 22 100-004', 'ana.lazar@gmail.com',      'Str. Bulgară 78',                  'Chișinău', 'Moldova', 3),
('Mihai',      'Stoica',     '1982-09-10', 'male',   '+373 22 100-005', 'mihai.stoica@mail.md',     'Calea Ieșilor 23',                 'Chișinău', 'Moldova', 4),
('Elena',      'Vlad',       '1988-12-25', 'female', '+373 22 100-006', NULL,                       'Str. Mioriței 56',                 'Chișinău', 'Moldova', 4),
('Andrei',     'Costin',     '1975-04-08', 'male',   '+373 22 100-007', 'andrei.costin@gmail.com',  'Bdul Negruzzi 102',                'Chișinău', 'Moldova', 5),
('Diana',      'Pavel',      '1992-08-14', 'female', '+373 22 100-008', 'diana.pavel@yahoo.com',    'Str. 31 August 89',                'Chișinău', 'Moldova', 5),
('Sergiu',     'Lupu',       '1980-02-19', 'male',   '+373 22 100-009', NULL,                       'Str. Studenților 14',              'Chișinău', 'Moldova', 6),
('Cristina',   'Rusu',       '1987-06-03', 'female', '+373 22 100-010', 'cristina.rusu@mail.md',    'Str. Hîncești 234',                'Chișinău', 'Moldova', 6),
-- Batch 2 — Rusofoni (5)
('Сергей',     'Иванов',     '1970-01-12', 'male',   '+373 22 200-001', 'sergey.ivanov@mail.ru',    'Str. Cuza Vodă 45',                'Chișinău', 'Moldova', 2),
('Анна',       'Петрова',    '1985-04-23', 'female', '+373 22 200-002', 'anna.petrova@gmail.com',   'Bdul Decebal 12',                  'Chișinău', 'Moldova', 3),
('Алексей',    'Сидоров',    '1978-08-30', 'male',   '+373 22 200-003', NULL,                       'Str. Albișoara 67',                'Chișinău', 'Moldova', 4),
('Ольга',      'Кузнецова',  '1993-11-05', 'female', '+373 22 200-004', 'olga.k@yandex.ru',         'Str. Eminescu 89',                 'Chișinău', 'Moldova', 5),
('Дмитрий',    'Смирнов',    '1982-02-16', 'male',   '+373 22 200-005', 'dmitry@gmail.com',          'Bdul Moscova 23',                  'Chișinău', 'Moldova', 6),
-- Batch 3 — Moldoveni (10)
('Stefan',     'Drăgan',     '1965-07-19', 'male',   '+373 22 300-001', NULL,                       'Str. Bucuriei 12',                 'Chișinău', 'Moldova', 2),
('Tatiana',    'Bârsan',     '1973-10-28', 'female', '+373 22 300-002', 'tatiana.b@mail.md',        'Str. Pușkin 56',                   'Chișinău', 'Moldova', 3),
('Cornel',     'Bejenari',   '1988-03-04', 'male',   '+373 22 300-003', 'cornel.b@gmail.com',       'Str. Tighina 78',                  'Chișinău', 'Moldova', 4),
('Liliana',    'Crăciun',    '1976-12-15', 'female', '+373 22 300-004', NULL,                       'Str. Asachi 23',                   'Chișinău', 'Moldova', 5),
('Vladimir',   'Țurcanu',    '1981-05-21', 'male',   '+373 22 300-005', 'v.turcanu@mail.md',        'Bdul Renașterii 145',              'Chișinău', 'Moldova', 6),
('Iulia',      'Bordea',     '1994-09-08', 'female', '+373 22 300-006', 'iulia.bordea@yahoo.com',   'Str. Sciusev 90',                  'Chișinău', 'Moldova', 2),
('Gheorghe',   'Antoci',     '1969-04-17', 'male',   '+373 22 300-007', NULL,                       'Calea Orheiului 23',               'Chișinău', 'Moldova', 3),
('Veronica',   'Caraman',    '1989-11-25', 'female', '+373 22 300-008', 'v.caraman@gmail.com',      'Str. Hâncu 67',                    'Chișinău', 'Moldova', 4),
('Adrian',     'Moroșanu',   '1983-08-13', 'male',   '+373 22 300-009', 'adrian.m@mail.md',         'Str. Trandafirilor 45',            'Chișinău', 'Moldova', 5),
('Doina',      'Russu',      '1991-02-28', 'female', '+373 22 300-010', NULL,                       'Str. Florilor 89',                 'Chișinău', 'Moldova', 6),
-- Batch 4 (10)
('Radu',       'Cebanu',     '1979-06-11', 'male',   '+373 22 400-001', 'radu.cebanu@gmail.com',    'Str. Albă 12',                     'Chișinău', 'Moldova', 2),
('Carolina',   'Frunză',     '1996-10-09', 'female', '+373 22 400-002', 'caro.frunza@gmail.com',    'Str. Stejarului 34',               'Chișinău', 'Moldova', 3),
('Constantin', 'Ungureanu',  '1972-01-26', 'male',   '+373 22 400-003', NULL,                       'Str. Salcâmilor 56',               'Chișinău', 'Moldova', 4),
('Nicoleta',   'Dabija',     '1986-12-07', 'female', '+373 22 400-004', 'nicoleta.d@yahoo.com',     'Str. Plopilor 78',                 'Chișinău', 'Moldova', 5),
('Alexandru',  'Cojocaru',   '1984-04-22', 'male',   '+373 22 400-005', 'alex.cojocaru@mail.md',    'Str. Magnoliei 90',                'Chișinău', 'Moldova', 6),
('Aurica',     'Botnaru',    '1990-07-15', 'female', '+373 22 400-006', NULL,                       'Bdul Mircea cel Bătrân 234',       'Chișinău', 'Moldova', 2),
('Pavel',      'Donică',     '1977-11-03', 'male',   '+373 22 400-007', 'pavel.donica@gmail.com',   'Str. Petricani 67',                'Chișinău', 'Moldova', 3),
('Lucia',      'Gangan',     '1985-03-29', 'female', '+373 22 400-008', 'lucia.g@mail.md',          'Str. Drumul Crucii 12',            'Chișinău', 'Moldova', 4),
('Ștefan',     'Bantuș',     '1981-09-14', 'male',   '+373 22 400-009', NULL,                       'Bdul Cuza Vodă 90',                'Chișinău', 'Moldova', 5),
('Daniela',    'Cuznețov',   '1993-05-06', 'female', '+373 22 400-010', 'daniela.c@gmail.com',      'Str. Pietrarilor 56',              'Chișinău', 'Moldova', 6),
-- Batch 5 (10)
('Eugen',      'Verejanu',   '1975-08-23', 'male',   '+373 22 500-001', 'eugen.v@yahoo.com',        'Str. Sarmizegetusa 23',            'Chișinău', 'Moldova', 2),
('Mariana',    'Sîrbu',      '1988-12-19', 'female', '+373 22 500-002', NULL,                       'Str. Vlaicu Pârcălab 45',          'Chișinău', 'Moldova', 3),
('Octavian',   'Voicu',      '1982-06-08', 'male',   '+373 22 500-003', 'o.voicu@gmail.com',        'Str. Cogălniceanu 78',             'Chișinău', 'Moldova', 4),
('Inga',       'Suceveanu',  '1989-10-31', 'female', '+373 22 500-004', 'inga.s@mail.md',           'Str. Tudor Strișcă 90',            'Chișinău', 'Moldova', 5),
('Anatol',     'Voloșin',    '1973-02-12', 'male',   '+373 22 500-005', NULL,                       'Str. Mihai Viteazul 12',           'Chișinău', 'Moldova', 6),
('Olesea',     'Tarus',      '1995-07-25', 'female', '+373 22 500-006', 'olesea.t@gmail.com',       'Str. Vasile Lupu 34',              'Chișinău', 'Moldova', 2),
('Igor',       'Bivol',      '1980-11-17', 'male',   '+373 22 500-007', 'igor.bivol@yahoo.com',     'Str. Sfatul Țării 56',             'Chișinău', 'Moldova', 3),
('Svetlana',   'Petrachi',   '1986-04-02', 'female', '+373 22 500-008', NULL,                       'Str. Negruzzi 78',                 'Chișinău', 'Moldova', 4),
('Tudor',      'Bostan',     '1971-09-28', 'male',   '+373 22 500-009', 'tudor.b@gmail.com',        'Bdul Ștefan cel Mare 234',         'Chișinău', 'Moldova', 5),
('Galina',     'Pleșca',     '1987-01-15', 'female', '+373 22 500-010', 'galina.p@mail.md',         'Str. Studenților 67',              'Chișinău', 'Moldova', 6),
-- Batch 6 (10)
('Mihail',     'Dontu',      '1984-05-09', 'male',   '+373 22 600-001', NULL,                       'Str. Vlad Țepeș 12',               'Chișinău', 'Moldova', 2),
('Lilia',      'Cazac',      '1990-12-21', 'female', '+373 22 600-002', 'lilia.cazac@gmail.com',    'Str. Bulgară 90',                  'Chișinău', 'Moldova', 3),
('Ghenadie',   'Negrei',     '1978-07-04', 'male',   '+373 22 600-003', 'g.negrei@yahoo.com',       'Str. Cuza Vodă 56',                'Chișinău', 'Moldova', 4),
('Rodica',     'Onceanu',    '1992-03-13', 'female', '+373 22 600-004', NULL,                       'Str. Mateevici 78',                'Chișinău', 'Moldova', 5),
('Nicolae',    'Grosu',      '1974-08-26', 'male',   '+373 22 600-005', 'nicolae.g@mail.md',        'Calea Basarabiei 23',              'Chișinău', 'Moldova', 6),
('Aliona',     'Caraman',    '1983-11-08', 'female', '+373 22 600-006', 'aliona.c@gmail.com',       'Str. Drumul Schinoasei 45',        'Chișinău', 'Moldova', 2),
('Vitalie',    'Condrat',    '1977-03-19', 'male',   '+373 22 600-007', 'vitalie.c@mail.md',        'Str. Calea Ieșilor 67',            'Chișinău', 'Moldova', 3),
('Tamara',     'Florea',     '1991-06-27', 'female', '+373 22 600-008', NULL,                       'Str. Mitropolit Dosoftei 34',      'Chișinău', 'Moldova', 4),
('Leonid',     'Sava',       '1968-09-05', 'male',   '+373 22 600-009', 'leonid.s@gmail.com',       'Str. Calea Moșilor 89',            'Chișinău', 'Moldova', 5),
('Irina',      'Moraru',     '1994-12-12', 'female', '+373 22 600-010', 'irina.moraru@yahoo.com',   'Bdul Independenței 45',            'Chișinău', 'Moldova', 6);

-- ============================================================================
-- 4. PROGRAMĂRI — APPOINTMENTS (200 total pe 90 zile)
-- ============================================================================

-- 4a. Astăzi — 25 programări cu statusuri mixte
INSERT INTO appointments ("patientId", "doctorId", "roomId", date, time, status, duration, notes)
SELECT
  ((random() * 59) + 1)::int,
  ((random() * 4)  + 2)::int,
  ((random() * 4)  + 1)::int,
  TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'),
  TO_CHAR(('09:00'::time + (gs.n * 30 || ' minutes')::interval), 'HH24:MI'),
  CASE
    WHEN gs.n < 8  THEN 'completed'::appointments_status_enum
    WHEN gs.n < 16 THEN 'in_progress'::appointments_status_enum
    ELSE                'scheduled'::appointments_status_enum
  END,
  CASE WHEN random() < 0.5 THEN 30 ELSE 60 END,
  'Consultație programată'
FROM generate_series(0, 24) AS gs(n);

-- 4b. Ultima săptămână — 50 programări (completate)
INSERT INTO appointments ("patientId", "doctorId", "roomId", date, time, status, duration, notes)
SELECT
  ((random() * 59) + 1)::int,
  ((random() * 4)  + 2)::int,
  ((random() * 4)  + 1)::int,
  TO_CHAR(CURRENT_DATE - ((random() * 6)::int + 1), 'YYYY-MM-DD'),
  TO_CHAR(('08:00'::time + (random() * 540)::int * '1 minute'::interval), 'HH24:MI'),
  'completed'::appointments_status_enum,
  CASE WHEN random() < 0.5 THEN 30 ELSE 60 END,
  'Consultație realizată'
FROM generate_series(1, 50);

-- 4c. Ultimele 90 zile — 125 programări (mixte)
INSERT INTO appointments ("patientId", "doctorId", "roomId", date, time, status, duration, notes)
SELECT
  ((random() * 59) + 1)::int,
  ((random() * 4)  + 2)::int,
  ((random() * 4)  + 1)::int,
  TO_CHAR(CURRENT_DATE - ((random() * 83)::int + 7), 'YYYY-MM-DD'),
  TO_CHAR(('08:00'::time + (random() * 540)::int * '1 minute'::interval), 'HH24:MI'),
  CASE
    WHEN random() < 0.82 THEN 'completed'::appointments_status_enum
    WHEN random() < 0.93 THEN 'cancelled'::appointments_status_enum
    ELSE                      'in_progress'::appointments_status_enum
  END,
  CASE WHEN random() < 0.5 THEN 30 ELSE 60 END,
  'Vizită medicală'
FROM generate_series(1, 125);

-- ============================================================================
-- 5. STUDII RADIOLOGICE — STUDIES (30 studii pe 60 zile)
-- ============================================================================

INSERT INTO studies (
  "studyId", "patientId", "radiologistId", "referringDoctorId",
  type, status, priority, "bodyPart", description, "scheduledAt",
  "numberOfSeries", "numberOfImages", price
)
SELECT
  'STD-' || LPAD(gs.n::text, 6, '0'),
  ((random() * 59) + 1)::int,
  CASE WHEN random() < 0.5 THEN 9 ELSE 10 END,
  ((random() * 4)  + 2)::int,
  (ARRAY['ct','mri','xray','ultrasound']::studies_type_enum[])[floor(random() * 4 + 1)],
  CASE
    WHEN random() < 0.68 THEN 'completed'::studies_status_enum
    WHEN random() < 0.84 THEN 'in_progress'::studies_status_enum
    WHEN random() < 0.92 THEN 'scheduled'::studies_status_enum
    ELSE                      'pending'::studies_status_enum
  END,
  (ARRAY['routine','urgent','stat']::studies_priority_enum[])[floor(random() * 3 + 1)],
  (ARRAY['Cap', 'Coloana cervicală', 'Toracele', 'Abdomenul',
         'Pelvis', 'Membre inferioare', 'Genunchi', 'Umăr'])[floor(random() * 8 + 1)],
  'Studiu radiologic conform indicațiilor clinice',
  TO_CHAR(CURRENT_DATE - ((random() * 60)::int), 'YYYY-MM-DD'),
  ((random() * 3) + 1)::int,
  ((random() * 100) + 20)::int,
  ROUND((random() * 1000 + 500)::numeric, 2)
FROM generate_series(1, 30) AS gs(n);

-- ============================================================================
-- 6. COMENZI LABORATOR — LAB ORDERS (100 comenzi pe 30 zile)
-- ============================================================================

INSERT INTO lab_orders (
  "orderNumber", "patientId", "doctorId", "labTechnicianId", "testId",
  status, priority, "scheduledAt"
)
SELECT
  'LAB-' || LPAD(gs.n::text, 6, '0'),
  ((random() * 59) + 1)::int,
  ((random() * 4)  + 2)::int,
  CASE
    WHEN random() < 0.33 THEN 11
    WHEN random() < 0.66 THEN 12
    ELSE                      13
  END,
  ((random() * 29) + 1)::int,   -- testId 1-30 din catalog
  CASE
    WHEN random() < 0.68 THEN 'completed'::lab_orders_status_enum
    WHEN random() < 0.83 THEN 'in_progress'::lab_orders_status_enum
    WHEN random() < 0.93 THEN 'pending'::lab_orders_status_enum
    ELSE                      'cancelled'::lab_orders_status_enum
  END,
  (ARRAY['routine','urgent','stat']::lab_orders_priority_enum[])[floor(random() * 3 + 1)],
  TO_CHAR(CURRENT_DATE - ((random() * 30)::int), 'YYYY-MM-DD')
FROM generate_series(1, 100) AS gs(n);

-- ============================================================================
-- STATISTICĂ FINALĂ
-- ============================================================================

SELECT '=== STATISTICĂ DATE DEMO ===' AS section;

SELECT tabel, total FROM (
  SELECT 'Pacienți'              AS tabel, COUNT(*) AS total FROM patients
  UNION ALL
  SELECT 'Utilizatori',                    COUNT(*)           FROM users
  UNION ALL
  SELECT 'Programări',                     COUNT(*)           FROM appointments
  UNION ALL
  SELECT 'Studii RIS',                     COUNT(*)           FROM studies
  UNION ALL
  SELECT 'Comenzi laborator LIS',          COUNT(*)           FROM lab_orders
  UNION ALL
  SELECT 'Camere',                         COUNT(*)           FROM rooms
  UNION ALL
  SELECT 'Teste laborator (catalog)',      COUNT(*)           FROM lab_tests
) t;

SELECT 'Programări ASTĂZI' AS info, COUNT(*) AS total
FROM appointments
WHERE date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');

SELECT 'Studii pe tip' AS info, type, COUNT(*) AS total
FROM studies
GROUP BY type
ORDER BY total DESC;

SELECT 'Comenzi pe status' AS info, status, COUNT(*) AS total
FROM lab_orders
GROUP BY status
ORDER BY total DESC;
