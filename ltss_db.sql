/*!40101 SET NAMES utf8mb4 */;

DROP DATABASE IF EXISTS ltss_db_test;
CREATE DATABASE ltss_db_test;
use ltss_db_test;

CREATE TABLE user(
    uid INT AUTO_INCREMENT, 
    email VARCHAR(128) NOT NULL, 
    pwd VARCHAR(32) NOT NULL, 
    PRIMARY KEY (uid)
);

CREATE TABLE driver(
    did INT AUTO_INCREMENT, 
    name VARCHAR(32) NOT NULL,
    lpnum VARCHAR(8) UNIQUE, 
    contact VARCHAR(11) UNIQUE, 
    lat VARCHAR(17),
    lon VARCHAR(17), 
    uid INT NOT NULL, 
    PRIMARY KEY (did), 
    FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE
);

CREATE TABLE task(
    tid INT AUTO_INCREMENT, 
    dep VARCHAR(128) NOT NULL,
    dep_adress VARCHAR(128), 
    dest VARCHAR(128) NOT NULL, 
    dest_adress VARCHAR(128),
    dep_time_min TIMESTAMP, 
    dep_time_max TIMESTAMP, 
    dest_time_min TIMESTAMP, 
    dest_time_max TIMESTAMP, 
    dep_lat VARCHAR(17), 
    dep_lon VARCHAR(17), 
    dest_lat VARCHAR(17), 
    dest_lon VARCHAR(17), 
    t_time INT, 
    r_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uid INT NOT NULL, 
    PRIMARY KEY (tid), 
    FOREIGN KEY (uid) 
    REFERENCES user(uid) ON DELETE CASCADE
);


CREATE TABLE place(
    pid INT AUTO_INCREMENT, 
    name VARCHAR(128), 
    adress VARCHAR(128),
    lon VARCHAR(17) NOT NULL, 
    lat VARCHAR(17) NOT NULL, 
    count INT DEFAULT 0,
    PRIMARY KEY (pid)
);

INSERT INTO user (email, pwd) VALUES ('test@test.com', '0000');

INSERT INTO place (name, adress, lon, lat) VALUES 
('평택서부두', '경기 평택시 포승읍 신영리 671', '126.885935193061', '36.9390447587094'),
('인천2부두', '인천 중구 항동7가 1-33', '126.627288990714', '37.4626643817422'),
('인천대한제분', '인천 중구 북성동1가 4', '126.615780440948', '37.4789213031288'),
('음성피그넷', '충북 음성군 금왕읍 오선리 218-3', '127.563147905719', '36.9795239385309'),
('광양제일로지스', '전남 광양시 도이동 852', '127.668536364038', '34.91498191067057'),
('용인한일사료', '경기 용인시 기흥구 하갈동 213', '127.099061572871', '37.259340653753'),
('생극오뚜기제유', '충북 음성군 생극면 병암리 771', '127.60636371066957', '37.02153784093465');