-- object: public.users | type: TABLE --
CREATE TABLE public.users(
	username varchar(50) NOT NULL,
	password varchar(50) NOT NULL,
	enabled boolean NOT NULL,
	CONSTRAINT users_pk PRIMARY KEY (username)
)
WITH (OIDS=FALSE);

-- object: public.authorities | type: TABLE -- 
CREATE TABLE public.authorities(
	username varchar(50) NOT NULL,
	authority varchar(50),
	CONSTRAINT ix_auth_username UNIQUE (username,authority)
)
WITH (OIDS=FALSE);

-- object: public.supply | type: TABLE -- 
CREATE TABLE public.metrics(
	metric_timestamp timestamp,
	lat double precision,
	lon double precision,
	altitude double precision,
	heading double precision,
	temp double precision,
	radiation double precision
)
WITH (OIDS=FALSE);

ALTER TABLE public.authorities ADD CONSTRAINT fk_authorities_users FOREIGN KEY (username)
REFERENCES public.users (username) MATCH FULL
ON DELETE NO ACTION ON UPDATE NO ACTION NOT DEFERRABLE;


