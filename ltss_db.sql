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
    coord VARCHAR(16), 
    uid INT NOT NULL, 
    PRIMARY KEY (did), 
    FOREIGN KEY (uid) REFERENCES user(uid) ON DELETE CASCADE
);

CREATE TABLE job(
    jid INT, 
    dep VARCHAR(128) NOT NULL, 
    dest VARCHAR(128) NOT NULL, 
    dep_time TIMESTAMP NOT NULL, 
    dest_time TIMESTAMP NOT NULL, 
    dep_coord VARCHAR(16), 
    dest_coord VARCHAR(16), 
    time INT, 
    uid INT NOT NULL, 
    PRIMARY KEY (jid), 
    FOREIGN KEY (uid) 
    REFERENCES user(uid) ON DELETE CASCADE
);

CREATE TABLE location(
    name VARCHAR(128), 
    coordinate VARCHAR(16) NOT NULL, 
    PRIMARY KEY (name)
);