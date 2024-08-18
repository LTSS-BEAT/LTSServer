USE map_db_expanded;

-- 'data' 테이블의 데이터 복사
INSERT INTO data (id, dep_x, dep_y, dest_x, dest_y, duration)
SELECT id, dep_x, dep_y, dest_x, dest_y, duration
FROM map_db.data;

-- 'excluded' 테이블의 데이터 복사
INSERT INTO excluded (x, y)
SELECT x, y
FROM map_db.excluded;

-- 'included' 테이블의 데이터 복사
INSERT INTO included (x, y)
SELECT x, y
FROM map_db.included;
