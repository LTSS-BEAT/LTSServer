/*!40101 SET NAMES utf8mb4 */;

DROP DATABASE IF EXISTS map_db_expanded;
CREATE DATABASE map_db_expanded;
USE map_db_expanded;

CREATE TABLE data (
    id INT AUTO_INCREMENT, 
    dep_x VARCHAR(8) NOT NULL,
    dep_y VARCHAR(7) NOT NULL,
    dest_x VARCHAR(8) NOT NULL,
    dest_y VARCHAR(7) NOT NULL, 
    duration INT NOT NULL, 
    PRIMARY KEY (id)
);

CREATE TABLE excluded (
    x VARCHAR(8) NOT NULL,
    y VARCHAR(7) NOT NULL,
    PRIMARY KEY (x, y)
);

CREATE TABLE included (
    x VARCHAR(8) NOT NULL,
    y VARCHAR(7) NOT NULL,
    PRIMARY KEY (x, y)
);
