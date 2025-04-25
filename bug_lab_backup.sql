--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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

--
-- Name: bugs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bugs_id_seq OWNED BY public.bugs.id;


--
-- Name: scientist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scientist (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.scientist OWNER TO postgres;

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

--
-- Name: scientist_bugs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scientist_bugs_id_seq OWNED BY public.scientist_bugs.id;


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

--
-- Name: scientist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scientist_id_seq OWNED BY public.scientist.id;


--
-- Name: bugs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bugs ALTER COLUMN id SET DEFAULT nextval('public.bugs_id_seq'::regclass);


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

COPY public.bugs (id, name, strength, type, created_at) FROM stdin;
1	Cursed Cockroach	10	ground	2025-04-17 16:27:34.869525
2	Pincer Ant	20	ground	2025-04-17 16:27:34.869525
3	Filthy Fly	30	air	2025-04-17 16:27:34.869525
4	Stink Bug	40	air	2025-04-17 16:27:34.869525
5	Hornet	50	air	2025-04-17 16:27:34.869525
6	Scarab Beetle	60	ground	2025-04-17 16:27:34.869525
8	Ladybug	80	ground	2025-04-17 16:27:34.869525
9	Dragonfly	90	air	2025-04-17 16:27:34.869525
10	Butterfly	100	air	2025-04-17 16:27:34.869525
11	Slimy Snail	2	ground	2025-04-19 14:14:50.820096
13	Melirio	60	water	2025-04-19 14:22:34.616084
12	Crusty Crab	80	water	2025-04-19 14:20:20.782328
17	millipede	20	ground	2025-04-19 17:17:54.696049
18	centipede	99	ground	2025-04-23 10:16:51.709202
19	certapillar	90	ground	2025-04-23 10:17:29.86755
20	Cricket	50	ground	2025-04-23 10:18:53.470505
21	test bug	12	ground	2025-04-24 16:05:30.267209
\.


--
-- Data for Name: scientist; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scientist (id, name, email, password, created_at) FROM stdin;
1	Gojo Satoru	gojo@jujutsu.jp	sixeyes99	2025-04-17 16:27:34.869525
3	Rick Sanchez	rick@omega.com	wubbalubbadubdub	2025-04-17 16:27:34.869525
7	Power	w0469628@gmail.com	mnbV	2025-04-18 11:46:19.385893
11	Denji	devilHunter@got.com	123	2025-04-22 16:04:03.395856
12	Samurai Jack	samurai@longAgo.com	123	2025-04-23 10:20:47.77555
4	Sideburns Guy	villain@devilhunters.com	123	2025-04-17 16:27:34.869525
13	Gumball	amazingWorldofGumball@awesomeness.com	123	2025-04-23 10:24:59.412071
14	Summer Sanchez	wallabdubdub@rickCitadel.com	123	2025-04-23 10:26:26.047837
2	Rudeus Grayrat	rudeus@fittoa.com	managod	2025-04-17 16:27:34.869525
16	Madam M	doubleaweseven@uk.com	1	2025-04-24 15:22:00.904391
\.


--
-- Data for Name: scientist_bugs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scientist_bugs (id, scientist_id, bug_id, assigned_at) FROM stdin;
1	1	1	2025-04-17 16:27:34.869525
2	1	2	2025-04-17 16:27:34.869525
4	2	10	2025-04-21 10:52:39.667326
9	2	11	2025-04-21 11:03:21.584775
15	3	11	2025-04-21 11:25:26.074729
16	2	12	2025-04-21 11:42:51.586349
17	7	8	2025-04-21 11:50:30.399449
19	4	12	2025-04-22 16:04:16.260471
20	11	10	2025-04-22 16:04:21.929346
21	3	12	2025-04-22 19:19:36.673167
22	3	20	2025-04-23 10:20:03.255103
23	12	10	2025-04-23 10:21:09.832596
24	12	9	2025-04-23 10:21:26.879762
25	12	13	2025-04-23 10:21:35.26333
26	12	5	2025-04-23 21:18:22.662666
27	13	13	2025-04-23 21:38:24.112102
28	16	18	2025-04-24 15:38:05.202632
\.


--
-- Name: bugs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bugs_id_seq', 21, true);


--
-- Name: scientist_bugs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.scientist_bugs_id_seq', 28, true);


--
-- Name: scientist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.scientist_id_seq', 16, true);


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
-- Name: scientist scientist_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

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
-- PostgreSQL database dump complete
--

