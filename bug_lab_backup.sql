--
-- PostgreSQL database schema with users table and scientist-user relation
--
-- This script assumes the target database (e.g., bugs_scientist_db) already exists
-- and you are connected to it.

-- Drop existing tables and sequences to allow rerunning the script
-- These drops will run within the currently connected database
DROP TABLE IF EXISTS public.scientist_bugs CASCADE;
DROP TABLE IF EXISTS public.scientist CASCADE;
DROP TABLE IF EXISTS public.bugs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE; -- Drop users table if it exists

DROP SEQUENCE IF EXISTS public.bugs_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.scientist_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.scientist_bugs_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.users_id_seq CASCADE; -- Drop users sequence

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
--SET transaction_timeout = 0; -- Comment out or remove if still causing errors
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Name: bugs; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE public.bugs (
    id integer NOT NULL,
    name text NOT NULL,
    strength integer NOT NULL,
    type text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.bugs OWNER TO postgres;

--
-- Name: bugs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--
CREATE SEQUENCE public.bugs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.bugs_id_seq OWNER TO postgres;
ALTER SEQUENCE public.bugs_id_seq OWNED BY public.bugs.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY, -- Auto-incrementing primary key
    email text NOT NULL UNIQUE, -- Email used for login, must be unique
    hashed_password text NOT NULL, -- Store hashed passwords (NEVER plain text!)
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP -- Optional: add an updated_at timestamp
);
ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--
-- SERIAL automatically creates the sequence, but let's explicitly define it for clarity in dump
CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.users_id_seq OWNER TO postgres;
-- SERIAL also handles OWNED BY implicitly


--
-- Name: scientist; Type: TABLE; Schema: public; Owner: postgres
--
-- Modified: Removed 'password' column, added 'user_id' column
CREATE TABLE public.scientist (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL UNIQUE, -- Keep unique email for scientist profile
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer UNIQUE -- Link to the users table, ensure one scientist per user
);
ALTER TABLE public.scientist OWNER TO postgres;

--
-- Name: scientist_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--
CREATE SEQUENCE public.scientist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.scientist_id_seq OWNER TO postgres;
ALTER SEQUENCE public.scientist_id_seq OWNED BY public.scientist.id;


--
-- Name: scientist_bugs; Type: TABLE; Schema: public; Owner: postgres
--
CREATE TABLE public.scientist_bugs (
    id integer NOT NULL,
    scientist_id integer NOT NULL,
    bug_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.scientist_bugs OWNER TO postgres;

--
-- Name: scientist_bugs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--
CREATE SEQUENCE public.scientist_bugs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.scientist_bugs_id_seq OWNER TO postgres;
ALTER SEQUENCE public.scientist_bugs_id_seq OWNED BY public.scientist_bugs.id;


--
-- Name: bugs id; Type: DEFAULT; Schema: public; Owner: postgres
--
ALTER TABLE ONLY public.bugs ALTER COLUMN id SET DEFAULT nextval('public.bugs_id_seq'::regclass);

--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: scientist id; Type: DEFAULT; Schema: public; Owner: postgres
--
ALTER TABLE ONLY public.scientist ALTER COLUMN id SET DEFAULT nextval('public.scientist_id_seq'::regclass);


--
-- Name: scientist_bugs id; Type: DEFAULT; Schema: public; Owner: postgres
--
ALTER TABLE ONLY public.scientist_bugs ALTER COLUMN id SET DEFAULT nextval('public.scientist_bugs_id_seq'::regclass);


--
-- Data for Name: bugs; Type: TABLE DATA; Schema: public; Owner: postgres
--
-- Replaced COPY ... FROM stdin with INSERT INTO statements
INSERT INTO public.bugs (id, name, strength, type, created_at) VALUES
(1, 'Cursed Cockroach', 10, 'ground', '2025-04-17 16:27:34.869525'),
(2, 'Pincer Ant', 20, 'ground', '2025-04-17 16:27:34.869525'),
(3, 'Filthy Fly', 30, 'air', '2025-04-17 16:27:34.869525'),
(4, 'Stink Bug', 40, 'air', '2025-04-17 16:27:34.869525'),
(5, 'Hornet', 50, 'air', '2025-04-17 16:27:34.869525'),
(6, 'Scarab Beetle', 60, 'ground', '2025-04-17 16:27:34.869525'),
(8, 'Ladybug', 80, 'ground', '2025-04-17 16:27:34.869525'),
(9, 'Dragonfly', 90, 'air', '2025-04-17 16:27:34.869525'),
(10, 'Butterfly', 100, 'air', '2025-04-17 16:27:34.869525'),
(11, 'Slimy Snail', 2, 'ground', '2025-04-19 14:14:50.820096'),
(13, 'Melirio', 60, 'water', '2025-04-19 14:22:34.616084'),
(12, 'Crusty Crab', 80, 'water', '2025-04-19 14:20:20.782328'),
(17, 'millipede', 20, 'ground', '2025-04-19 17:17:54.696049'),
(18, 'centipede', 99, 'ground', '2025-04-23 10:16:51.709202'),
(19, 'certapillar', 90, 'ground', '2025-04-23 10:17:29.86755'),
(20, 'Cricket', 50, 'ground', '2025-04-23 10:18:53.470505'),
(21, 'test bug', 12, 'ground', '2025-04-24 16:05:30.267209');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--
-- Add dummy data to the 'users' table, matching some scientist emails
-- IMPORTANT: Replace 'hashed_password_...' with actual bcrypt hashes generated by your backend
-- Replaced COPY ... FROM stdin with INSERT INTO statements
INSERT INTO public.users (id, email, hashed_password, created_at, updated_at) VALUES
(1, 'gojo@jujutsu.jp', '$2a$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUV/dummyhash1', '2025-05-17 16:00:00', '2025-05-17 16:00:00'), -- Replace with actual hash for gojo@jujutsu.jp's password
(2, 'rick@omega.com', '$2a$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUV/dummyhash2', '2025-05-17 16:01:00', '2025-05-17 16:01:00'), -- Replace with actual hash for rick@omega.com's password
(3, 'w0469628@gmail.com', '$2a$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUV/dummyhash3', '2025-05-17 16:02:00', '2025-05-17 16:02:00'), -- Replace with actual hash for w0469628@gmail.com's password
(4, 'devilHunter@got.com', '$2a$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUV/dummyhash4', '2025-05-17 16:03:00', '2025-05-17 16:03:00'), -- Replace with actual hash for devilHunter@got.com's password
(5, 'samurai@longAgo.com', '$2a$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUV/dummyhash5', '2025-05-17 16:04:00', '2025-05-17 16:04:00'), -- Replace with actual hash for samurai@longAgo.com's password
(6, 'amazingWorldofGumball@awesomeness.com', '$2a$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUV/dummyhash6', '2025-05-17 16:05:00', '2025-05-17 16:05:00'), -- Replace with actual hash for amazingWorldofGumball@awesomeness.com's password
(7, 'wallabdubdub@rickCitadel.com', '$2a$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUV/dummyhash7', '2025-05-17 16:06:00', '2025-05-17 16:06:00'), -- Replace with actual hash for wallabdubdub@rickCitadel.com's password
(8, 'doubleaweseven@uk.com', '$2a$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUV/dummyhash8', '2025-05-17 16:07:00', '2025-05-17 16:07:00'), -- Replace with actual hash for doubleaweseven@uk.com's password
-- Adding a couple of users without matching scientist profiles initially
(9, 'newuser1@example.com', '$2a$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUV/dummyhash9', '2025-05-17 16:08:00', '2025-05-17 16:08:00'), -- Replace with actual hash for newuser1@example.com's password
(10, 'newuser2@example.com', '$2a$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUV/dummyhash10', '2025-05-17 16:09:00', '2025-05-17 16:09:00'); -- Replace with actual hash for newuser2@example.com's password


--
-- Data for Name: scientist; Type: TABLE DATA; Schema: public; Owner: postgres
--
-- Replaced COPY ... FROM stdin with INSERT INTO statements
INSERT INTO public.scientist (id, name, email, created_at) VALUES
(1, 'Gojo Satoru', 'gojo@jujutsu.jp', '2025-04-17 16:27:34.869525'),
(3, 'Rick Sanchez', 'rick@omega.com', '2025-04-17 16:27:34.869525'),
(7, 'Power', 'w0469628@gmail.com', '2025-04-18 11:46:19.385893'),
(11, 'Denji', 'devilHunter@got.com', '2025-04-22 16:04:03.395856'),
(12, 'Samurai Jack', 'samurai@longAgo.com', '2025-04-23 10:20:47.77555'),
(4, 'Sideburns Guy', 'villain@devilhunters.com', '2025-04-17 16:27:34.869525'),
(13, 'Gumball', 'amazingWorldofGumball@awesomeness.com', '2025-04-23 10:24:59.412071'),
(14, 'Summer Sanchez', 'wallabdubdub@rickCitadel.com', '2025-04-23 10:26:26.047837'),
(2, 'Rudeus Grayrat', 'rudeus@fittoa.com', '2025-04-17 16:27:34.869525'),
(16, 'Madam M', 'doubleaweseven@uk.com', '2025-04-24 15:22:00.904391');


--
-- Data for Name: scientist_bugs; Type: TABLE DATA; Schema: public; Owner: postgres
--
-- Replaced COPY ... FROM stdin with INSERT INTO statements
INSERT INTO public.scientist_bugs (id, scientist_id, bug_id, assigned_at) VALUES
(1, 1, 1, '2025-04-17 16:27:34.869525'),
(2, 1, 2, '2025-04-17 16:27:34.869525'),
(4, 2, 10, '2025-04-21 10:52:39.667326'),
(9, 2, 11, '2025-04-21 11:03:21.584775'),
(15, 3, 11, '2025-04-21 11:25:26.074729'),
(16, 2, 12, '2025-04-21 11:42:51.586349'),
(17, 7, 8, '2025-04-21 11:50:30.399449'),
(19, 4, 12, '2025-04-22 16:04:16.260471'),
(20, 11, 10, '2025-04-22 16:04:21.929346'),
(21, 3, 12, '2025-04-22 19:19:36.673167'),
(22, 3, 20, '2025-04-23 10:20:03.255103'),
(23, 12, 10, '2025-04-23 10:21:09.832596'),
(24, 12, 9, '2025-04-23 10:21:26.879762'),
(25, 12, 13, '2025-04-23 10:21:35.26333'),
(26, 12, 5, '2025-04-23 21:18:22.662666'),
(27, 13, 13, '2025-04-23 21:38:24.112102'),
(28, 16, 18, '2025-04-24 15:38:05.202632');


--
-- Name: bugs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--
SELECT pg_catalog.setval('public.bugs_id_seq', 21, true);

--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--
-- Set the sequence to start after the last dummy user ID inserted
SELECT pg_catalog.setval('public.users_id_seq', 10, true);


--
-- Name: scientist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--
SELECT pg_catalog.setval('public.scientist_id_seq', 16, true);


--
-- Name: scientist_bugs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--
SELECT pg_catalog.setval('public.scientist_bugs_id_seq', 28, true);


--
-- Name: bugs bugs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--
ALTER TABLE ONLY public.bugs
    ADD CONSTRAINT bugs_pkey PRIMARY KEY (id);


--
-- Name: scientist_bugs scientist_bugs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--
ALTER TABLE ONLY public.scientist_bugs
    ADD CONSTRAINT scientist_bugs_pkey PRIMARY KEY (id);


--
-- Name: scientist_bugs scientist_bugs_scientist_id_bug_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--
ALTER TABLE ONLY public.scientist_bugs
    ADD CONSTRAINT scientist_bugs_scientist_id_bug_id_key UNIQUE (scientist_id, bug_id);

--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

-- Add index on users.email for faster lookups
CREATE INDEX ON public.users (email);


--
-- Name: scientist scientist_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--
-- Keep unique email for scientist profile if needed
ALTER TABLE ONLY public.scientist
    ADD CONSTRAINT scientist_email_key UNIQUE (email);

--
-- Name: scientist scientist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--
ALTER TABLE ONLY public.scientist
    ADD CONSTRAINT scientist_pkey PRIMARY KEY (id);


--
-- Name: scientist_bugs scientist_bugs_bug_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--
ALTER TABLE ONLY public.scientist_bugs
    ADD CONSTRAINT scientist_bugs_bug_id_fkey FOREIGN KEY (bug_id) REFERENCES public.bugs(id) ON DELETE CASCADE;

--
-- Name: scientist_bugs scientist_bugs_scientist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--
ALTER TABLE ONLY public.scientist_bugs
    ADD CONSTRAINT scientist_bugs_scientist_id_fkey FOREIGN KEY (scientist_id) REFERENCES public.scientist(id) ON DELETE CASCADE;

--
-- Name: scientist fk_scientist_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--
-- Add foreign key from scientist.user_id to users.id
ALTER TABLE ONLY public.scientist
    ADD CONSTRAINT fk_scientist_user
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;


--
-- Update scientist.user_id based on matching email addresses in users table
-- This links existing scientist records to the new user records
UPDATE public.scientist
SET user_id = u.id
FROM public.users u
WHERE public.scientist.email = u.email;


--
-- PostgreSQL database dump complete
--