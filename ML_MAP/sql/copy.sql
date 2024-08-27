USE map_db_expanded_backup;

-- -- 'data' 테이블의 데이터 복사
INSERT INTO data (dep_x, dep_y, dest_x, dest_y, duration, x1, y1, d1, x2, y2, d2, x3, y3, d3, x4, y4, d4, x5, y5, d5, x6, y6, d6, x7, y7, d7, x8, y8, d8, x9, y9, d9, x10, y10, d10,
x11, y11, d11, x12, y12, d12, x13, y13, d13, x14, y14, d14, x15, y15, d15, x16, y16, d16, x17, y17, d17, x18, y18, d18, x19, y19, d19, x20, y20, d20, 
x21, y21, d21, x22, y22, d22, x23, y23, d23, x24, y24, d24, x25, y25, d25, x26, y26, d26, x27, y27, d27, x28, y28, d28, x29, y29, d29, x30, y30, d30, 
x31, y31, d31, x32, y32, d32, x33, y33, d33, x34, y34, d34, x35, y35, d35, x36, y36, d36, x37, y37, d37, x38, y38, d38, x39, y39, d39, x40, y40, d40, 
x41, y41, d41, x42, y42, d42, x43, y43, d43, x44, y44, d44, x45, y45, d45, x46, y46, d46, x47, y47, d47, x48, y48, d48, x49, y49, d49, x50, y50, d50)
SELECT dep_x, dep_y, dest_x, dest_y, duration, x1, y1, d1, x2, y2, d2, x3, y3, d3, x4, y4, d4, x5, y5, d5, x6, y6, d6, x7, y7, d7, x8, y8, d8, x9, y9, d9, x10, y10, d10,
x11, y11, d11, x12, y12, d12, x13, y13, d13, x14, y14, d14, x15, y15, d15, x16, y16, d16, x17, y17, d17, x18, y18, d18, x19, y19, d19, x20, y20, d20,
x21, y21, d21, x22, y22, d22, x23, y23, d23, x24, y24, d24, x25, y25, d25, x26, y26, d26, x27, y27, d27, x28, y28, d28, x29, y29, d29, x30, y30, d30,
x31, y31, d31, x32, y32, d32, x33, y33, d33, x34, y34, d34, x35, y35, d35, x36, y36, d36, x37, y37, d37, x38, y38, d38, x39, y39, d39, x40, y40, d40,
x41, y41, d41, x42, y42, d42, x43, y43, d43, x44, y44, d44, x45, y45, d45, x46, y46, d46, x47, y47, d47, x48, y48, d48, x49, y49, d49, x50, y50, d50
FROM map_db_expanded.data;

-- 'excluded' 테이블의 데이터 복사
INSERT INTO excluded (x, y)
SELECT x, y
FROM map_db_expanded.excluded;

-- 'included' 테이블의 데이터 복사
INSERT INTO included (x, y)
SELECT x, y
FROM map_db_expanded.included;
