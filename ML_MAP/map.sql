/*!40101 SET NAMES utf8mb4 */;

DROP DATABASE IF EXISTS map_db;
CREATE DATABASE map_db;
use map_db;

CREATE TABLE data (
    id INT AUTO_INCREMENT, 
    dep_x VARCHAR(6) NOT NULL,
    dep_y VARCHAR(5) NOT NULL,
    dest_x VARCHAR(6) NOT NULL,
    dest_y VARCHAR(5) NOT NULL, 
    duration INT NOT NULL, 
    PRIMARY KEY (id)
);

CREATE TABLE excluded (
    x VARCHAR(6) NOT NULL,
    y VARCHAR(5) NOT NULL,
    PRIMARY KEY (x, y)
);

/* 34.3, 38.4*/
/* 126.1, 129.55*/