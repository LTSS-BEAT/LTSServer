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
    contact VARCHAR(11) UNIQUE, 
    lat VARCHAR(17),
    lon VARCHAR(17), 
    uid INT NOT NULL, 
    PRIMARY KEY (did), 
    FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE
);

CREATE TABLE job(
    jid INT, 
    dep VARCHAR(128) NOT NULL, 
    dest VARCHAR(128) NOT NULL, 
    dep_time_min TIMESTAMP, 
    dep_time_max TIMESTAMP, 
    dest_time_min TIMESTAMP, 
    dest_time_max TIMESTAMP, 
    dep_lat VARCHAR(17), 
    dep_lon VARCHAR(17), 
    dest_lat VARCHAR(17), 
    dest_lon VARCHAR(17), 
    j_time INT, 
    uid INT NOT NULL, 
    PRIMARY KEY (jid), 
    FOREIGN KEY (uid) 
    REFERENCES user(uid) ON DELETE CASCADE
);

CREATE TABLE location(
    name VARCHAR(128), 
    lat VARCHAR(17) NOT NULL, 
    lon VARCHAR(17) NOT NULL, 
    PRIMARY KEY (name)
);