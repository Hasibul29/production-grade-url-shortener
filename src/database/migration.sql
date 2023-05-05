CREATE SEQUENCE user_id_seq;

CREATE TABLE Users (
  user_id BIGINT DEFAULT NEXTVAL('user_id_seq') PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(255) NOT NULL
);

CREATE TABLE Urls (
  user_id BIGINT REFERENCES Users(user_id),
  short_url VARCHAR(255) PRIMARY KEY,
  original_url VARCHAR(2048) NOT NULL,
  creation_time TIMESTAMP NOT NULL DEFAULT NOW(),
  total_clicked INTEGER NOT NULL
);

CREATE TABLE AccountSecurity (
  user_id BIGINT REFERENCES Users(user_id),
  failed_login_attempts INTEGER NOT NULL,
  email_is_verified BOOLEAN NOT NULL,
  role VARCHAR(255) NOT NULL
);

CREATE TABLE Feature (
  short_url VARCHAR(255) REFERENCES Urls(short_url),
  user_location VARCHAR(255) NOT NULL,
  browser_name VARCHAR(255) NOT NULL,
  access_time TIMESTAMP NOT NULL DEFAULT NOW()
);

