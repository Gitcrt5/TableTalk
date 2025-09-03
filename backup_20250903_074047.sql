--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (84ade85)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: comment_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.comment_type AS ENUM (
    'analysis',
    'question',
    'teaching',
    'general'
);


ALTER TYPE public.comment_type OWNER TO neondb_owner;

--
-- Name: event_kind; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.event_kind AS ENUM (
    'club_session',
    'practice_set',
    'casual_play',
    'tournament',
    'teaching'
);


ALTER TYPE public.event_kind OWNER TO neondb_owner;

--
-- Name: event_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.event_status AS ENUM (
    'draft',
    'published',
    'closed',
    'archived'
);


ALTER TYPE public.event_status OWNER TO neondb_owner;

--
-- Name: game_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.game_role AS ENUM (
    'owner',
    'player',
    'teacher',
    'viewer'
);


ALTER TYPE public.game_role OWNER TO neondb_owner;

--
-- Name: game_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.game_type AS ENUM (
    'USER',
    'CLUB'
);


ALTER TYPE public.game_type OWNER TO neondb_owner;

--
-- Name: pair_side_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.pair_side_type AS ENUM (
    'NS',
    'EW',
    'Unknown'
);


ALTER TYPE public.pair_side_type OWNER TO neondb_owner;

--
-- Name: registration_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.registration_type AS ENUM (
    'formal_pairs',
    'open_registration',
    'invite_only'
);


ALTER TYPE public.registration_type OWNER TO neondb_owner;

--
-- Name: seat_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.seat_type AS ENUM (
    'N',
    'E',
    'S',
    'W'
);


ALTER TYPE public.seat_type OWNER TO neondb_owner;

--
-- Name: visibility_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.visibility_type AS ENUM (
    'private',
    'link',
    'public'
);


ALTER TYPE public.visibility_type OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: boards; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.boards (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    game_id character varying NOT NULL,
    board_number integer NOT NULL,
    dealer text,
    vulnerability text,
    hands jsonb NOT NULL,
    bidding_sequence jsonb,
    contract text,
    declarer text,
    result integer,
    lead_card text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    event_deal_id character varying(255),
    north_hand text,
    east_hand text,
    south_hand text,
    west_hand text,
    optimum_info jsonb,
    bidding jsonb,
    tricks_taken integer,
    score integer,
    percentage numeric(5,2),
    matchpoints numeric(8,2),
    bidding_notes text,
    play_notes text,
    learning_points text,
    is_analyzed boolean DEFAULT false,
    analysis_quality integer,
    CONSTRAINT analysis_quality_check CHECK (((analysis_quality >= 1) AND (analysis_quality <= 5))),
    CONSTRAINT board_number_check CHECK ((board_number >= 1))
);


ALTER TABLE public.boards OWNER TO neondb_owner;

--
-- Name: clubs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.clubs (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    location text,
    website text,
    contact_email text,
    visibility public.visibility_type DEFAULT 'public'::public.visibility_type,
    is_verified boolean DEFAULT false,
    member_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.clubs OWNER TO neondb_owner;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.comments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    board_id character varying NOT NULL,
    author_id character varying NOT NULL,
    content text NOT NULL,
    is_private boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    event_deal_id character varying(255),
    user_id character varying(255),
    body text,
    comment_type public.comment_type DEFAULT 'analysis'::public.comment_type,
    visibility public.visibility_type DEFAULT 'public'::public.visibility_type,
    parent_comment_id character varying(255),
    thread_depth integer DEFAULT 0,
    is_flagged boolean DEFAULT false,
    flagged_reason text,
    flag_count integer DEFAULT 0,
    is_deleted boolean DEFAULT false,
    is_educational boolean DEFAULT false,
    teaching_level text,
    CONSTRAINT reasonable_thread_depth CHECK ((thread_depth <= 10)),
    CONSTRAINT teaching_level_check CHECK ((teaching_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text]))),
    CONSTRAINT thread_depth_check CHECK ((thread_depth >= 0))
);


ALTER TABLE public.comments OWNER TO neondb_owner;

--
-- Name: event_deals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_deals (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    event_id character varying(255) NOT NULL,
    board_number integer NOT NULL,
    dealer text NOT NULL,
    vulnerability text NOT NULL,
    north_hand text,
    east_hand text,
    south_hand text,
    west_hand text,
    optimum_info jsonb,
    double_dummy_info jsonb,
    par_contract text,
    makeable_contracts jsonb,
    source_format text DEFAULT 'manual'::text,
    pbn_data text,
    is_validated boolean DEFAULT false,
    validation_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT board_number_check CHECK ((board_number >= 1)),
    CONSTRAINT dealer_check CHECK ((dealer = ANY (ARRAY['N'::text, 'E'::text, 'S'::text, 'W'::text]))),
    CONSTRAINT source_format_check CHECK ((source_format = ANY (ARRAY['manual'::text, 'pbn'::text, 'acbl'::text, 'bridgebase'::text]))),
    CONSTRAINT vulnerability_check CHECK ((vulnerability = ANY (ARRAY['None'::text, 'NS'::text, 'EW'::text, 'Both'::text])))
);


ALTER TABLE public.event_deals OWNER TO neondb_owner;

--
-- Name: event_results; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_results (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    event_id character varying(255) NOT NULL,
    board_number integer NOT NULL,
    pair_number integer,
    game_id character varying(255),
    session_identifier text,
    direction character(2),
    contract text,
    declarer character(1),
    lead_card text,
    tricks_taken integer,
    score integer,
    submitted_by character varying(255),
    is_anonymous boolean DEFAULT false,
    result_confidence integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT result_confidence_check CHECK (((result_confidence >= 1) AND (result_confidence <= 5))),
    CONSTRAINT result_identification CHECK (((pair_number IS NOT NULL) OR (game_id IS NOT NULL) OR (session_identifier IS NOT NULL)))
);


ALTER TABLE public.event_results OWNER TO neondb_owner;

--
-- Name: event_standings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_standings (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    event_id character varying(255) NOT NULL,
    pair_number integer,
    game_id character varying(255),
    session_identifier text,
    direction character(2),
    total_matchpoints numeric(8,2),
    percentage numeric(5,2),
    "position" integer,
    boards_played integer DEFAULT 0,
    games_linked integer DEFAULT 0,
    average_score numeric(8,2),
    boards_above_average integer DEFAULT 0,
    best_result_board integer,
    worst_result_board integer,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.event_standings OWNER TO neondb_owner;

--
-- Name: events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    club_name text NOT NULL,
    event_date timestamp without time zone NOT NULL,
    total_boards integer NOT NULL,
    event_type text NOT NULL,
    status text DEFAULT 'upcoming'::text NOT NULL,
    pbn_file_url text,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    kind public.event_kind DEFAULT 'club_session'::public.event_kind,
    registration_type public.registration_type DEFAULT 'open_registration'::public.registration_type,
    registration_deadline timestamp without time zone,
    max_participants integer,
    current_participants integer DEFAULT 0,
    is_published boolean DEFAULT false,
    published_at timestamp without time zone,
    results_published boolean DEFAULT false,
    scoring_method text DEFAULT 'matchpoints'::text,
    rounds integer DEFAULT 1,
    boards_per_round integer,
    boards_total integer,
    event_metadata jsonb,
    tags text[]
);


ALTER TABLE public.events OWNER TO neondb_owner;

--
-- Name: favourite_clubs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.favourite_clubs (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    club_id character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.favourite_clubs OWNER TO neondb_owner;

--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.feature_flags (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    flag_name text NOT NULL,
    name text,
    description text,
    is_enabled boolean DEFAULT false,
    target_users character varying(255)[],
    target_user_types text[],
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.feature_flags OWNER TO neondb_owner;

--
-- Name: game_participants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.game_participants (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    game_id character varying(255) NOT NULL,
    user_id character varying(255),
    display_name text,
    invite_email text,
    role public.game_role DEFAULT 'player'::public.game_role,
    seat public.seat_type,
    side public.pair_side_type,
    pair_number integer,
    is_confirmed boolean DEFAULT false,
    joined_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT participant_identity CHECK (((user_id IS NOT NULL) OR (display_name IS NOT NULL) OR (invite_email IS NOT NULL)))
);


ALTER TABLE public.game_participants OWNER TO neondb_owner;

--
-- Name: games; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.games (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    creator_id character varying NOT NULL,
    partner_id character varying,
    visibility text DEFAULT 'public'::text NOT NULL,
    event_id character varying,
    pbn_data jsonb,
    total_boards integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    game_date timestamp without time zone DEFAULT now() NOT NULL,
    club_name text,
    type public.game_type DEFAULT 'USER'::public.game_type,
    owner_id character varying(255),
    is_published boolean DEFAULT false,
    published_at timestamp without time zone,
    session_notes text,
    completed_boards integer DEFAULT 0,
    pair_numbers text[],
    session_metadata jsonb
);


ALTER TABLE public.games OWNER TO neondb_owner;

--
-- Name: partnerships; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.partnerships (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    player1_id character varying NOT NULL,
    player2_id character varying NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    games_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id character varying(255),
    partner_user_id character varying(255),
    partnership_name text,
    notes text,
    is_active boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.partnerships OWNER TO neondb_owner;

--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_preferences (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    preference_key text NOT NULL,
    preference_value jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_preferences OWNER TO neondb_owner;

--
-- Name: user_types; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_types (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    label text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_types OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    display_name text NOT NULL,
    firebase_uid text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    first_name text,
    last_name text,
    user_type_id character varying,
    is_active boolean DEFAULT true NOT NULL,
    last_login timestamp with time zone,
    preferences jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    home_club_id character varying(255),
    bridgebase_username text,
    acbl_number text,
    skill_level text,
    privacy_level public.visibility_type DEFAULT 'public'::public.visibility_type,
    preferred_seat public.seat_type,
    coaching_status text,
    teaching_credentials text,
    bio text,
    bridge_experience_years integer
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Data for Name: boards; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.boards (id, game_id, board_number, dealer, vulnerability, hands, bidding_sequence, contract, declarer, result, lead_card, notes, created_at, updated_at, event_deal_id, north_hand, east_hand, south_hand, west_hand, optimum_info, bidding, tricks_taken, score, percentage, matchpoints, bidding_notes, play_notes, learning_points, is_analyzed, analysis_quality) FROM stdin;
80c3202f-745c-4142-9f09-fca5793de0e6	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	1	N	None	{"E": {"C": "AQ6", "D": "72", "H": "AJ76", "S": "AK75"}, "N": {"C": "J983", "D": "T65", "H": "9", "S": "T8632"}, "S": {"C": "T5", "D": "Q93", "H": "KQT43", "S": "Q94"}, "W": {"C": "K742", "D": "AKJ84", "H": "852", "S": "J"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:41.548568	2025-08-28 08:33:41.548568	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
a3807792-a710-46db-a90a-3baf00f30159	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	2	E	NS	{"E": {"C": "KJ", "D": "942", "H": "AT764", "S": "875"}, "N": {"C": "Q762", "D": "KJ83", "H": "Q5", "S": "K63"}, "S": {"C": "A9843", "D": "A75", "H": "J82", "S": "AT"}, "W": {"C": "T5", "D": "QT6", "H": "K93", "S": "QJ942"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:41.598119	2025-08-28 08:33:41.598119	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
d1923600-bde5-452e-941a-ff928ed54879	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	3	S	EW	{"E": {"C": "K", "D": "K62", "H": "JT6", "S": "AK8754"}, "N": {"C": "J942", "D": "53", "H": "8", "S": "QT9632"}, "S": {"C": "T7653", "D": "A94", "H": "K754", "S": "J"}, "W": {"C": "AQ8", "D": "QJT87", "H": "AQ932", "S": ""}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:41.640279	2025-08-28 08:33:41.640279	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
f87ac522-5dfe-4b00-8a71-908b53c0078c	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	4	W	Both	{"E": {"C": "K96", "D": "AQ7", "H": "J654", "S": "A76"}, "N": {"C": "A4", "D": "985", "H": "KQ9", "S": "Q8543"}, "S": {"C": "QT8732", "D": "6", "H": "A72", "S": "JT9"}, "W": {"C": "J5", "D": "KJT432", "H": "T83", "S": "K2"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:41.682817	2025-08-28 08:33:41.682817	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
306efcbf-d652-4544-96c5-5d3b34e979ab	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	5	N	NS	{"E": {"C": "J2", "D": "K8432", "H": "Q", "S": "AJ742"}, "N": {"C": "7543", "D": "6", "H": "T753", "S": "Q983"}, "S": {"C": "QT", "D": "Q75", "H": "K984", "S": "KT65"}, "W": {"C": "AK986", "D": "AJT9", "H": "AJ62", "S": ""}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:41.725311	2025-08-28 08:33:41.725311	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
814d8259-4afa-46f7-97f4-22746ef21dbf	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	6	E	EW	{"E": {"C": "98", "D": "QT6", "H": "JT8743", "S": "K9"}, "N": {"C": "J53", "D": "A5", "H": "96", "S": "AJ7642"}, "S": {"C": "AKQT2", "D": "KJ432", "H": "K5", "S": "5"}, "W": {"C": "764", "D": "987", "H": "AQ2", "S": "QT83"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:41.76738	2025-08-28 08:33:41.76738	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
421b05d1-8bae-414b-92c3-92b9a6dbaf46	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	7	S	Both	{"E": {"C": "AQJ7", "D": "6", "H": "T8764", "S": "J42"}, "N": {"C": "52", "D": "KQ732", "H": "2", "S": "AT865"}, "S": {"C": "K9843", "D": "95", "H": "AQ5", "S": "Q73"}, "W": {"C": "T6", "D": "AJT84", "H": "KJ93", "S": "K9"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:41.815748	2025-08-28 08:33:41.815748	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
f3909f42-faeb-416c-95df-13be443f8b91	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	8	W	None	{"E": {"C": "T8", "D": "K85", "H": "AQ6543", "S": "J3"}, "N": {"C": "KJ654", "D": "A9", "H": "9", "S": "KQ752"}, "S": {"C": "Q73", "D": "QT72", "H": "872", "S": "984"}, "W": {"C": "A92", "D": "J643", "H": "KJT", "S": "AT6"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:41.858597	2025-08-28 08:33:41.858597	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
1adf55ae-74c9-4040-8624-e10455066496	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	9	N	EW	{"E": {"C": "Q82", "D": "QJ2", "H": "97432", "S": "Q8"}, "N": {"C": "63", "D": "AKT86", "H": "AKQ8", "S": "A4"}, "S": {"C": "KJ54", "D": "953", "H": "T65", "S": "653"}, "W": {"C": "AT97", "D": "74", "H": "J", "S": "KJT972"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:41.900629	2025-08-28 08:33:41.900629	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
4c251976-40e1-4932-a6d8-e78426e4d998	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	10	E	Both	{"E": {"C": "KT3", "D": "AQ72", "H": "Q", "S": "T8642"}, "N": {"C": "A9876", "D": "43", "H": "JT85", "S": "A9"}, "S": {"C": "QJ", "D": "KJ5", "H": "9763", "S": "QJ75"}, "W": {"C": "542", "D": "T986", "H": "AK42", "S": "K3"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:41.944168	2025-08-28 08:33:41.944168	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
b3b1d952-b369-4ef7-8c7d-9eb0b1cedc73	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	11	S	None	{"E": {"C": "AK8", "D": "Q753", "H": "AJT8", "S": "76"}, "N": {"C": "Q654", "D": "AK8", "H": "Q5", "S": "J532"}, "S": {"C": "JT972", "D": "4", "H": "973", "S": "KQ94"}, "W": {"C": "3", "D": "JT962", "H": "K642", "S": "AT8"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:41.987029	2025-08-28 08:33:41.987029	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
480b4b45-8d52-42f3-b600-5f6672a81fa4	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	12	W	NS	{"E": {"C": "98654", "D": "KQJ2", "H": "95", "S": "A7"}, "N": {"C": "K2", "D": "76543", "H": "87", "S": "K942"}, "S": {"C": "QJT3", "D": "T98", "H": "AQT3", "S": "65"}, "W": {"C": "A7", "D": "A", "H": "KJ642", "S": "QJT83"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.028969	2025-08-28 08:33:42.028969	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
559f9f38-aefa-40a4-b0e1-fd0c7bff8169	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	13	N	Both	{"E": {"C": "K974", "D": "J943", "H": "Q5", "S": "K52"}, "N": {"C": "852", "D": "K52", "H": "KT874", "S": "63"}, "S": {"C": "QT3", "D": "QT8", "H": "J9", "S": "AJT84"}, "W": {"C": "AJ6", "D": "A76", "H": "A632", "S": "Q97"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.071176	2025-08-28 08:33:42.071176	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
30ece6e8-50e1-4c20-9d38-e195b4f51e97	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	14	E	None	{"E": {"C": "Q763", "D": "32", "H": "AT8", "S": "QJ85"}, "N": {"C": "AJ", "D": "AT74", "H": "97654", "S": "A7"}, "S": {"C": "42", "D": "K965", "H": "KQ2", "S": "K942"}, "W": {"C": "KT985", "D": "QJ8", "H": "J3", "S": "T63"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.113499	2025-08-28 08:33:42.113499	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
80f801ff-7021-4d56-a87f-dad6cbe067ac	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	15	S	NS	{"E": {"C": "AKT9532", "D": "J", "H": "AJ9", "S": "J4"}, "N": {"C": "QJ7", "D": "73", "H": "QT52", "S": "Q832"}, "S": {"C": "84", "D": "K842", "H": "K3", "S": "KT765"}, "W": {"C": "6", "D": "AQT965", "H": "8764", "S": "A9"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.156253	2025-08-28 08:33:42.156253	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
643f8f78-f6d8-459f-8085-9374a1f99cd8	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	16	W	EW	{"E": {"C": "Q", "D": "AT873", "H": "T6", "S": "J9752"}, "N": {"C": "K3", "D": "J9", "H": "AQJ754", "S": "AQ8"}, "S": {"C": "JT6542", "D": "Q6", "H": "9", "S": "KT43"}, "W": {"C": "A987", "D": "K542", "H": "K832", "S": "6"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.198961	2025-08-28 08:33:42.198961	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
1e779a2c-943f-4f3c-8428-fd0e0638521d	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	17	N	None	{"E": {"C": "52", "D": "AKJ76", "H": "JT82", "S": "A4"}, "N": {"C": "AK87", "D": "Q42", "H": "95", "S": "QJ97"}, "S": {"C": "QT643", "D": "T3", "H": "KQ63", "S": "53"}, "W": {"C": "J9", "D": "985", "H": "A74", "S": "KT862"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.24234	2025-08-28 08:33:42.24234	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
12c96eb2-0ca6-4f21-8eb1-5225f8685f47	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	18	E	NS	{"E": {"C": "8642", "D": "96", "H": "K75", "S": "A875"}, "N": {"C": "QJ9", "D": "T8", "H": "AQ4", "S": "KQT64"}, "S": {"C": "K5", "D": "KQ7542", "H": "T86", "S": "J9"}, "W": {"C": "AT73", "D": "AJ3", "H": "J932", "S": "32"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.284722	2025-08-28 08:33:42.284722	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
002235db-e581-4bc9-931f-ba12e48d5844	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	19	S	EW	{"E": {"C": "JT97", "D": "AKJ93", "H": "J", "S": "J42"}, "N": {"C": "AK2", "D": "Q52", "H": "Q75", "S": "K986"}, "S": {"C": "Q43", "D": "T84", "H": "K643", "S": "A73"}, "W": {"C": "865", "D": "76", "H": "AT982", "S": "QT5"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.328083	2025-08-28 08:33:42.328083	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
7a5e4984-1260-42b2-8cac-4237d81a3fe5	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	20	W	Both	{"E": {"C": "J54", "D": "KQ865", "H": "97", "S": "872"}, "N": {"C": "762", "D": "32", "H": "KQT86", "S": "KJ5"}, "S": {"C": "K93", "D": "JT974", "H": "J52", "S": "64"}, "W": {"C": "AQT8", "D": "A", "H": "A43", "S": "AQT93"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.370749	2025-08-28 08:33:42.370749	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
fbb84008-6ab7-40d6-9ee1-0e8f1f6fde22	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	21	N	NS	{"E": {"C": "KT862", "D": "82", "H": "J", "S": "KJ976"}, "N": {"C": "A75", "D": "Q754", "H": "AT742", "S": "A"}, "S": {"C": "QJ9", "D": "AKJT6", "H": "53", "S": "T43"}, "W": {"C": "43", "D": "93", "H": "KQ986", "S": "Q852"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.416106	2025-08-28 08:33:42.416106	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
5b27af99-b84f-432b-afc0-4f7688794ae2	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	22	E	EW	{"E": {"C": "T432", "D": "K9", "H": "9874", "S": "872"}, "N": {"C": "AK5", "D": "T863", "H": "K65", "S": "T93"}, "S": {"C": "9", "D": "54", "H": "QJT3", "S": "AKQJ64"}, "W": {"C": "QJ876", "D": "AQJ72", "H": "A2", "S": "5"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.458081	2025-08-28 08:33:42.458081	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
36cb5b09-5002-466c-b215-f3df308b4aa0	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	23	S	Both	{"E": {"C": "K8", "D": "KT7", "H": "AT4", "S": "K9876"}, "N": {"C": "JT9", "D": "A964", "H": "K98", "S": "QT4"}, "S": {"C": "AQ763", "D": "J83", "H": "J6", "S": "532"}, "W": {"C": "542", "D": "Q52", "H": "Q7532", "S": "AJ"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.500067	2025-08-28 08:33:42.500067	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
310b2db3-031d-4184-88d2-01c16bb43372	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	24	W	None	{"E": {"C": "Q752", "D": "AJ73", "H": "72", "S": "KT3"}, "N": {"C": "J863", "D": "K2", "H": "K86", "S": "Q982"}, "S": {"C": "K4", "D": "T9865", "H": "AJ", "S": "J764"}, "W": {"C": "AT9", "D": "Q4", "H": "QT9543", "S": "A5"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.542598	2025-08-28 08:33:42.542598	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
37a3cae1-a4d3-4c0c-b8ee-c4a17c749039	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	25	N	EW	{"E": {"C": "AQ32", "D": "KJ", "H": "AJT876", "S": "4"}, "N": {"C": "J984", "D": "943", "H": "5", "S": "QJ963"}, "S": {"C": "K75", "D": "AT6", "H": "Q", "S": "AT8752"}, "W": {"C": "T6", "D": "Q8752", "H": "K9432", "S": "K"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.590816	2025-08-28 08:33:42.590816	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
27b7e6bb-7abe-41cf-b795-dc5d95ae8e12	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	26	E	Both	{"E": {"C": "98", "D": "KQ84", "H": "AQ4", "S": "K982"}, "N": {"C": "KQ65", "D": "JT92", "H": "T93", "S": "53"}, "S": {"C": "AJT", "D": "763", "H": "8765", "S": "J64"}, "W": {"C": "7432", "D": "A5", "H": "KJ2", "S": "AQT7"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.63375	2025-08-28 08:33:42.63375	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
e148f0e8-7f0b-40ab-a5ea-81291c3418a9	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	27	S	None	{"E": {"C": "52", "D": "A62", "H": "K432", "S": "K762"}, "N": {"C": "A7", "D": "JT97", "H": "J9875", "S": "54"}, "S": {"C": "KJ863", "D": "KQ84", "H": "", "S": "QT98"}, "W": {"C": "QT94", "D": "53", "H": "AQT6", "S": "AJ3"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.67562	2025-08-28 08:33:42.67562	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
ef1010fd-b9e9-400b-a545-ca67cf03d7af	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	28	W	NS	{"E": {"C": "QT86", "D": "T8543", "H": "74", "S": "52"}, "N": {"C": "AK75", "D": "AQJ", "H": "QJ", "S": "JT96"}, "S": {"C": "4", "D": "962", "H": "T983", "S": "AKQ84"}, "W": {"C": "J932", "D": "K7", "H": "AK652", "S": "73"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.718547	2025-08-28 08:33:42.718547	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
91c661a0-7c4a-4daa-a8a0-090d887ef5ef	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	29	N	Both	{"E": {"C": "T", "D": "K652", "H": "QT92", "S": "KQJ2"}, "N": {"C": "963", "D": "JT93", "H": "KJ43", "S": "54"}, "S": {"C": "QJ875", "D": "AQ8", "H": "86", "S": "863"}, "W": {"C": "AK42", "D": "74", "H": "A75", "S": "AT97"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.760948	2025-08-28 08:33:42.760948	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
acb536f8-9987-4183-ac78-52e6edf3f203	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	30	E	None	{"E": {"C": "T762", "D": "T85", "H": "K8", "S": "J874"}, "N": {"C": "A9", "D": "KQ432", "H": "A53", "S": "AK3"}, "S": {"C": "QJ43", "D": "AJ76", "H": "Q72", "S": "QT"}, "W": {"C": "K85", "D": "9", "H": "JT964", "S": "9652"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.802978	2025-08-28 08:33:42.802978	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
01019d38-ed3b-4625-b6f3-0bae85881c00	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	31	S	NS	{"E": {"C": "T5", "D": "AJ762", "H": "A52", "S": "643"}, "N": {"C": "K8", "D": "QT985", "H": "KQ73", "S": "K2"}, "S": {"C": "AQJ4", "D": "K4", "H": "J9", "S": "QJ875"}, "W": {"C": "97632", "D": "3", "H": "T864", "S": "AT9"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.84557	2025-08-28 08:33:42.84557	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
83fad55c-b2de-418f-84ef-d776c18d546b	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	32	W	EW	{"E": {"C": "J3", "D": "T932", "H": "KJ942", "S": "72"}, "N": {"C": "KQ7", "D": "J4", "H": "73", "S": "AQJ964"}, "S": {"C": "842", "D": "AK75", "H": "QT", "S": "K853"}, "W": {"C": "AT965", "D": "Q86", "H": "A865", "S": "T"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.88759	2025-08-28 08:33:42.88759	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
b100aa5e-af0e-4637-8120-eefb214b678f	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	33	N	None	{"E": {"C": "63", "D": "K3", "H": "AK76", "S": "QT973"}, "N": {"C": "Q84", "D": "A", "H": "QT842", "S": "AJ86"}, "S": {"C": "AKJT97", "D": "QJ74", "H": "9", "S": "K2"}, "W": {"C": "52", "D": "T98652", "H": "J53", "S": "54"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.931729	2025-08-28 08:33:42.931729	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
8a8938fe-cb3d-490c-ba95-17822d7d0f18	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	34	E	NS	{"E": {"C": "J2", "D": "KJT9652", "H": "Q", "S": "965"}, "N": {"C": "A987", "D": "A84", "H": "J54", "S": "K74"}, "S": {"C": "K3", "D": "Q7", "H": "T98732", "S": "A82"}, "W": {"C": "QT654", "D": "3", "H": "AK6", "S": "QJT3"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:42.974838	2025-08-28 08:33:42.974838	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
1f798d3c-9722-45f3-a5de-850470d3261f	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	35	S	EW	{"E": {"C": "AT65", "D": "Q5", "H": "J52", "S": "AK82"}, "N": {"C": "84", "D": "872", "H": "A9643", "S": "976"}, "S": {"C": "KQJ972", "D": "AKJT", "H": "KQ", "S": "T"}, "W": {"C": "3", "D": "9643", "H": "T87", "S": "QJ543"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:43.017614	2025-08-28 08:33:43.017614	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
61bc7547-322b-48c6-bcc4-d4c3c4e47dc3	d7f57fc0-254d-4032-a5fe-f52a31f4fa58	36	W	Both	{"E": {"C": "KQ964", "D": "J92", "H": "8", "S": "A542"}, "N": {"C": "72", "D": "AQ654", "H": "KT95", "S": "J8"}, "S": {"C": "AJ853", "D": "7", "H": "AJ2", "S": "QT96"}, "W": {"C": "T", "D": "KT83", "H": "Q7643", "S": "K73"}}	\N	\N	\N	\N	\N	\N	2025-08-28 08:33:43.060422	2025-08-28 08:33:43.060422	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
\.


--
-- Data for Name: clubs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.clubs (id, name, description, location, website, contact_email, visibility, is_verified, member_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.comments (id, board_id, author_id, content, is_private, created_at, updated_at, event_deal_id, user_id, body, comment_type, visibility, parent_comment_id, thread_depth, is_flagged, flagged_reason, flag_count, is_deleted, is_educational, teaching_level) FROM stdin;
\.


--
-- Data for Name: event_deals; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.event_deals (id, event_id, board_number, dealer, vulnerability, north_hand, east_hand, south_hand, west_hand, optimum_info, double_dummy_info, par_contract, makeable_contracts, source_format, pbn_data, is_validated, validation_notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: event_results; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.event_results (id, event_id, board_number, pair_number, game_id, session_identifier, direction, contract, declarer, lead_card, tricks_taken, score, submitted_by, is_anonymous, result_confidence, created_at) FROM stdin;
\.


--
-- Data for Name: event_standings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.event_standings (id, event_id, pair_number, game_id, session_identifier, direction, total_matchpoints, percentage, "position", boards_played, games_linked, average_score, boards_above_average, best_result_board, worst_result_board, updated_at) FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.events (id, name, description, club_name, event_date, total_boards, event_type, status, pbn_file_url, created_by, created_at, kind, registration_type, registration_deadline, max_participants, current_participants, is_published, published_at, results_published, scoring_method, rounds, boards_per_round, boards_total, event_metadata, tags) FROM stdin;
\.


--
-- Data for Name: favourite_clubs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.favourite_clubs (id, user_id, club_id, created_at) FROM stdin;
\.


--
-- Data for Name: feature_flags; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.feature_flags (id, flag_name, name, description, is_enabled, target_users, target_user_types, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: game_participants; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.game_participants (id, game_id, user_id, display_name, invite_email, role, seat, side, pair_number, is_confirmed, joined_at, created_at) FROM stdin;
\.


--
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.games (id, name, description, creator_id, partner_id, visibility, event_id, pbn_data, total_boards, created_at, updated_at, game_date, club_name, type, owner_id, is_published, published_at, session_notes, completed_boards, pair_numbers, session_metadata) FROM stdin;
82f4f1b0-f326-4ba7-8930-62cbbc677dc7	My first game		ce5b6fcb-6389-48a4-9beb-d9317340822f	\N	public	\N	\N	0	2025-08-21 05:51:33.760115	2025-08-21 05:51:33.760115	2025-08-27 07:09:40.17115	\N	USER	\N	f	\N	\N	0	\N	\N
d7f57fc0-254d-4032-a5fe-f52a31f4fa58	Another game	some kind of description	ce5b6fcb-6389-48a4-9beb-d9317340822f	\N	public	\N	\N	36	2025-08-28 08:33:41.489989	2025-08-28 08:33:43.086	2025-08-28 00:00:00		USER	\N	f	\N	\N	0	\N	\N
\.


--
-- Data for Name: partnerships; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.partnerships (id, player1_id, player2_id, status, games_count, created_at, user_id, partner_user_id, partnership_name, notes, is_active, updated_at) FROM stdin;
\.


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_preferences (id, user_id, preference_key, preference_value, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_types; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_types (id, code, label, description, created_at) FROM stdin;
bc2d1ee7-57ee-4bfa-9e2b-c559568b7045	player	Player	Standard bridge player	2025-08-24 05:06:30.672733+00
a01515c4-44ea-4b89-ab2e-d339add3db63	teacher	Teacher	Bridge instructor with teaching tools	2025-08-24 05:06:30.672733+00
e1905bd5-e584-427a-8b47-26bb55b58461	admin	Administrator	Platform administrator	2025-08-24 05:06:30.672733+00
1403a99d-6289-4783-bdc6-a56bb5000881	moderator	Moderator	Community moderator	2025-08-24 05:06:30.672733+00
da1941ee-b7d7-4a15-8e47-c0db3312b78c	test	Test User	Test account for development	2025-08-24 05:06:30.672733+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, display_name, firebase_uid, created_at, is_admin, first_name, last_name, user_type_id, is_active, last_login, preferences, updated_at, home_club_id, bridgebase_username, acbl_number, skill_level, privacy_level, preferred_seat, coaching_status, teaching_credentials, bio, bridge_experience_years) FROM stdin;
e921d83e-c98c-4006-88b0-201dd506bddd	craig.rt@craigandlee.com	Craig Roberts-Thomson (Admin)	pending-firebase-uid	2025-08-24 05:07:31.118704	t	\N	\N	e1905bd5-e584-427a-8b47-26bb55b58461	t	\N	{}	2025-08-24 05:07:31.118704+00	\N	\N	\N	\N	public	\N	\N	\N	\N	\N
ce5b6fcb-6389-48a4-9beb-d9317340822f	craig.rt@gmail.com	Craig Roberts-Thomson (CRT)	4BG67tKPbMbFVYBYKYcljLYEx9p1	2025-08-21 05:30:34.980198	t	\N	\N	e1905bd5-e584-427a-8b47-26bb55b58461	t	\N	{}	2025-08-24 06:11:04.860169+00	\N	\N	\N	\N	public	\N	\N	\N	\N	\N
8f315619-4b90-4a74-85a6-8ec7334adc56	craig@craigandlee.com	craig@craigandlee.com	LaaSlaTEuKeKmols1Q7zqlKuItA3	2025-08-24 23:23:28.567595	f	\N	\N	\N	t	\N	{}	2025-08-24 23:23:28.567595+00	\N	\N	\N	\N	public	\N	\N	\N	\N	\N
\.


--
-- Name: boards boards_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_pkey PRIMARY KEY (id);


--
-- Name: clubs clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: event_deals event_deals_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_deals
    ADD CONSTRAINT event_deals_pkey PRIMARY KEY (id);


--
-- Name: event_results event_results_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_results
    ADD CONSTRAINT event_results_pkey PRIMARY KEY (id);


--
-- Name: event_standings event_standings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_standings
    ADD CONSTRAINT event_standings_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: favourite_clubs favourite_clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.favourite_clubs
    ADD CONSTRAINT favourite_clubs_pkey PRIMARY KEY (id);


--
-- Name: favourite_clubs favourite_clubs_user_id_club_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.favourite_clubs
    ADD CONSTRAINT favourite_clubs_user_id_club_id_key UNIQUE (user_id, club_id);


--
-- Name: feature_flags feature_flags_flag_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_flag_name_key UNIQUE (flag_name);


--
-- Name: feature_flags feature_flags_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_name_key UNIQUE (name);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: game_participants game_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.game_participants
    ADD CONSTRAINT game_participants_pkey PRIMARY KEY (id);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: partnerships partnerships_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partnerships
    ADD CONSTRAINT partnerships_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_user_id_preference_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_preference_key_key UNIQUE (user_id, preference_key);


--
-- Name: user_types user_types_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_types
    ADD CONSTRAINT user_types_code_key UNIQUE (code);


--
-- Name: user_types user_types_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_types
    ADD CONSTRAINT user_types_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_firebase_uid_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_firebase_uid_unique UNIQUE (firebase_uid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: boards boards_game_id_games_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_game_id_games_id_fk FOREIGN KEY (game_id) REFERENCES public.games(id);


--
-- Name: comments comments_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: comments comments_board_id_boards_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_board_id_boards_id_fk FOREIGN KEY (board_id) REFERENCES public.boards(id);


--
-- Name: event_deals event_deals_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_deals
    ADD CONSTRAINT event_deals_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_results event_results_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_results
    ADD CONSTRAINT event_results_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_results event_results_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_results
    ADD CONSTRAINT event_results_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id);


--
-- Name: event_results event_results_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_results
    ADD CONSTRAINT event_results_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(id);


--
-- Name: event_standings event_standings_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_standings
    ADD CONSTRAINT event_standings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_standings event_standings_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_standings
    ADD CONSTRAINT event_standings_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id);


--
-- Name: events events_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: favourite_clubs favourite_clubs_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.favourite_clubs
    ADD CONSTRAINT favourite_clubs_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;


--
-- Name: favourite_clubs favourite_clubs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.favourite_clubs
    ADD CONSTRAINT favourite_clubs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: boards fk_boards_event_deal; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT fk_boards_event_deal FOREIGN KEY (event_deal_id) REFERENCES public.event_deals(id);


--
-- Name: comments fk_comments_event_deal; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_comments_event_deal FOREIGN KEY (event_deal_id) REFERENCES public.event_deals(id) ON DELETE CASCADE;


--
-- Name: comments fk_comments_event_deal_new; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_comments_event_deal_new FOREIGN KEY (event_deal_id) REFERENCES public.event_deals(id) ON DELETE CASCADE;


--
-- Name: comments fk_comments_parent; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_comments_parent FOREIGN KEY (parent_comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comments fk_comments_user; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments fk_comments_user_new; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_comments_user_new FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: games fk_games_event; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT fk_games_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;


--
-- Name: games fk_games_owner; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT fk_games_owner FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: games fk_games_owner_new; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT fk_games_owner_new FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: partnerships fk_partnerships_partner; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partnerships
    ADD CONSTRAINT fk_partnerships_partner FOREIGN KEY (partner_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: partnerships fk_partnerships_user; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partnerships
    ADD CONSTRAINT fk_partnerships_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users fk_users_home_club; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_home_club FOREIGN KEY (home_club_id) REFERENCES public.clubs(id);


--
-- Name: game_participants game_participants_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.game_participants
    ADD CONSTRAINT game_participants_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: game_participants game_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.game_participants
    ADD CONSTRAINT game_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: games games_creator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_creator_id_users_id_fk FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: games games_event_id_events_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_event_id_events_id_fk FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: games games_partner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_partner_id_users_id_fk FOREIGN KEY (partner_id) REFERENCES public.users(id);


--
-- Name: partnerships partnerships_player1_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partnerships
    ADD CONSTRAINT partnerships_player1_id_users_id_fk FOREIGN KEY (player1_id) REFERENCES public.users(id);


--
-- Name: partnerships partnerships_player2_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partnerships
    ADD CONSTRAINT partnerships_player2_id_users_id_fk FOREIGN KEY (player2_id) REFERENCES public.users(id);


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_user_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_type_id_fkey FOREIGN KEY (user_type_id) REFERENCES public.user_types(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

