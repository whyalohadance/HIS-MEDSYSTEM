-- ============================================================================
-- HIS-MedSystem — Catalog teste de laborator (30 teste populare)
-- Rulare: docker exec -i his_postgres psql -U medical_user -d medical_db < lab-tests-catalog.sql
-- ============================================================================

-- IMPORTANT: doar INSERT, fără TRUNCATE
-- Dacă catalogul există — ignorăm duplicatele prin ON CONFLICT

INSERT INTO lab_tests (code, name, category, description, price, "durationHours", "isActive") VALUES

-- Hematologie (5 teste)
('CBC',    'Hemoleucogramă completă',    'hematology',   'Hemoglobină, eritrocite, leucocite, trombocite', 150.00,  1, true),
('HGB',    'Hemoglobina',                'hematology',   'Nivel hemoglobină în sânge',                     50.00,   1, true),
('PLT',    'Trombocite',                 'hematology',   'Număr de trombocite',                            60.00,   1, true),
('WBC',    'Leucocite cu formulă',       'hematology',   'Leucocite cu formulă leucocitară',               80.00,   1, true),
('ESR',    'VSH (VES)',                  'hematology',   'Viteza de sedimentare a eritrocitelor',          40.00,   1, true),

-- Biochimie (9 teste)
('GLU',    'Glucoză serică',             'biochemistry', 'Glicemie à jeun',                                70.00,   2, true),
('CHOL',   'Colesterol total',           'biochemistry', 'Colesterol total în sânge',                      80.00,   2, true),
('TG',     'Trigliceride',               'biochemistry', 'Trigliceride serice',                            90.00,   2, true),
('HDL',    'HDL-Colesterol',             'biochemistry', 'Colesterol "bun"',                               90.00,   2, true),
('LDL',    'LDL-Colesterol',             'biochemistry', 'Colesterol "rău"',                               90.00,   2, true),
('CREA',   'Creatinină',                 'biochemistry', 'Funcție renală — creatinină serică',             70.00,   2, true),
('UREA',   'Uree',                       'biochemistry', 'Funcție renală — uree serică',                   70.00,   2, true),
('ALT',    'ALT (TGP)',                  'biochemistry', 'Funcție hepatică — alanin-aminotransferază',     80.00,   2, true),
('AST',    'AST (TGO)',                  'biochemistry', 'Funcție hepatică — aspartat-aminotransferază',   80.00,   2, true),

-- Hormoni (5 teste)
('TSH',    'TSH',                        'hormones',     'Hormon tireostimulant',                         200.00,   4, true),
('FT4',    'Tiroxină liberă (FT4)',       'hormones',     'Funcție tiroidiană',                            220.00,   4, true),
('FT3',    'Triiodotironină liberă (FT3)','hormones',    'Funcție tiroidiană',                            220.00,   4, true),
('INSULIN','Insulină',                   'hormones',     'Nivel de insulină bazală',                      250.00,   4, true),
('CORT',   'Cortizol',                   'hormones',     'Hormon de stres — cortizol seric',              280.00,   4, true),

-- Urină (2 teste)
('URINE_G','Examen general urină',       'urine',        'Sumar de urină + sediment',                     100.00,   1, true),
('URINE_C','Urocultură',                 'urine',        'Cultură bacteriană cu antibiogramă',            200.00,  48, true),

-- Imunologie (3 teste)
('CRP',    'Proteina C reactivă',        'immunology',   'Marker de inflamație acută',                    100.00,   2, true),
('IGE',    'IgE total',                  'immunology',   'Imunoglobulina E',                              150.00,   4, true),
('ANA',    'Anticorpi antinucleari',     'immunology',   'Screening autoimunitate',                       250.00,   8, true),

-- Coagulare (2 teste)
('INR',    'INR / Timp protrombină',     'coagulation',  'Monitorizare anticoagulant',                     80.00,   1, true),
('FIBR',   'Fibrinogen',                 'coagulation',  'Factor de coagulare I',                          90.00,   2, true),

-- Cardiac (3 teste)
('TROP',   'Troponina I',                'cardiac',      'Marker de necroză miocardică',                  300.00,   2, true),
('BNP',    'BNP (peptid natriuretic)',   'cardiac',      'Marker insuficiență cardiacă',                  350.00,   4, true),
('CKMB',   'CK-MB',                      'cardiac',      'Creatinkinaza fracția MB',                      150.00,   2, true),

-- Microbiologie (1 test)
('HEMO_C', 'Hemocultură',               'microbiology', 'Cultură din sânge cu antibiogramă',             350.00,  72, true)

ON CONFLICT (code) DO NOTHING;

SELECT
  'Catalog teste încărcat cu succes' AS status,
  COUNT(*) AS total_teste
FROM lab_tests;

SELECT
  category,
  COUNT(*) AS teste
FROM lab_tests
GROUP BY category
ORDER BY category;
