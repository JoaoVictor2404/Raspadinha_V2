--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
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
-- Name: category; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.category AS ENUM (
    'gold-rush',
    'lucky-animals',
    'vegas-lights',
    'mythic-gods',
    'crypto-scratch',
    'candy-mania'
);

--
-- Name: delivery_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.delivery_status AS ENUM (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
);

--
-- Name: transaction_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.transaction_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'cancelled'
);

--
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.transaction_type AS ENUM (
    'deposit',
    'withdrawal',
    'purchase',
    'prize',
    'bonus',
    'commission'
);

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Name: affiliates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.affiliates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    referral_code text NOT NULL,
    total_referrals integer DEFAULT 0 NOT NULL,
    active_referrals integer DEFAULT 0 NOT NULL,
    commission_balance numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

--
-- Name: bonuses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.bonuses (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    description text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

--
-- Name: commissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.commissions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    affiliate_id character varying NOT NULL,
    referral_id character varying NOT NULL,
    transaction_id character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    percentage numeric(5,2) NOT NULL,
    is_paid boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

--
-- Name: deliveries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.deliveries (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    purchase_id character varying NOT NULL,
    status public.delivery_status DEFAULT 'pending'::public.delivery_status NOT NULL,
    address text,
    tracking_code text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

--
-- Name: prizes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.prizes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    raspadinha_id character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    label text NOT NULL,
    probability numeric(5,4) NOT NULL,
    image_url text
);

--
-- Name: purchases; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.purchases (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    raspadinha_id character varying NOT NULL,
    transaction_id character varying,
    prize_won numeric(10,2),
    prize_label text,
    is_revealed boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

--
-- Name: raspadinhas; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.raspadinhas (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    image_url text,
    category public.category DEFAULT 'gold-rush'::public.category NOT NULL,
    max_prize numeric(10,2) NOT NULL,
    badge text,
    is_active boolean DEFAULT true NOT NULL,
    stock integer DEFAULT 1000 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

--
-- Name: referrals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.referrals (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    affiliate_id character varying NOT NULL,
    referred_user_id character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.transactions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    type public.transaction_type NOT NULL,
    status public.transaction_status DEFAULT 'pending'::public.transaction_status NOT NULL,
    amount numeric(10,2) NOT NULL,
    description text,
    pix_code text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    affiliate_id character varying
);

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text,
    name text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

--
-- Name: wallets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.wallets (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    balance_total numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    balance_standard numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    balance_prizes numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    balance_bonus numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

--
-- Data for Name: raspadinhas; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO raspadinhas VALUES 
('99c12334-5efc-4dce-80d3-a50c5cd43e6e', 'gold-rush-basico', 'Gold Rush Básico', 'Ganhe até R$ 2.000 💰🪙', 2.00, 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400', 'gold-rush', 2000.00, 'Popular', true, 1000, '2025-10-16 23:19:02.17614'),
('b363b32b-04b9-427a-a4aa-0d61bbf4b665', 'gold-rush-premium', 'Gold Rush Premium', 'Jackpot 1000x - Ganhe até R$ 100.000 💎🏆', 10.00, 'https://images.unsplash.com/photo-1533327325824-76bc4e62d560?w=400', 'gold-rush', 100000.00, 'Jackpot', true, 1000, '2025-10-16 23:19:02.17614'),
('7f826289-28ab-4dfc-82b7-7b60c8ee83a3', 'lucky-animals', 'Lucky Animals', 'Animais da sorte te trazem prêmios 🐼🦊', 5.00, 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400', 'lucky-animals', 5000.00, '+Chance', true, 1000, '2025-10-16 23:19:02.17614'),
('abf12dce-d1db-48ec-92ff-8fb9d361275c', 'vegas-lights', 'Vegas Lights', 'Cassino de Las Vegas em suas mãos 🎰🎲', 20.00, 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400', 'vegas-lights', 200000.00, 'Premium', true, 1000, '2025-10-16 23:19:02.17614'),
('2b20fcec-74c2-4846-94d2-8fda5170968a', 'mythic-gods', 'Mythic Gods', 'Poder dos deuses mitológicos ⚡🔥', 15.00, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400', 'mythic-gods', 150000.00, 'Novo', true, 1000, '2025-10-16 23:19:02.17614'),
('b8d33151-4c10-4986-bd0f-f1e54b976d5f', 'crypto-scratch', 'Crypto Scratch', 'To the moon! 🚀🌕 - Jackpot 1000x', 25.00, 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400', 'crypto-scratch', 250000.00, 'Exclusivo', true, 1000, '2025-10-16 23:19:02.17614'),
('ffc3936e-e916-484c-8a7c-81c8e4abec6b', 'candy-mania', 'Candy Mania', 'Doce sorte te espera 🍭🍬', 1.00, 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400', 'candy-mania', 1000.00, 'Iniciante', true, 1000, '2025-10-16 23:19:02.17614');

--
-- Data for Name: prizes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO prizes VALUES 
-- Gold Rush Básico
('d9a0dca6-3269-4f36-af52-9ddb175976f7', '99c12334-5efc-4dce-80d3-a50c5cd43e6e', 2000.00, '💎 R$ 2.000', 0.0010, NULL),
('79edf037-f91b-49ca-8ac4-b7e389187ce6', '99c12334-5efc-4dce-80d3-a50c5cd43e6e', 500.00, '🏆 R$ 500', 0.0050, NULL),
('f6c4c375-8cec-45f9-bd24-c47ac937192c', '99c12334-5efc-4dce-80d3-a50c5cd43e6e', 100.00, '🪙 R$ 100', 0.0200, NULL),
('34b802fe-e2dd-418f-bd11-b0af1ccc0b39', '99c12334-5efc-4dce-80d3-a50c5cd43e6e', 20.00, '💰 R$ 20', 0.1000, NULL),
('2e4d5411-bb70-4644-8c98-9ba64f4de14c', '99c12334-5efc-4dce-80d3-a50c5cd43e6e', 10.00, '🔑 R$ 10', 0.2000, NULL),
('5d79a5fa-76d0-4fa1-9d74-c60560d8acc6', '99c12334-5efc-4dce-80d3-a50c5cd43e6e', 4.00, 'R$ 4', 0.3000, NULL),
('4ab4a00c-51b3-44e5-823b-816c778bac7e', '99c12334-5efc-4dce-80d3-a50c5cd43e6e', 0.00, 'Tente de novo', 0.3740, NULL),
-- Gold Rush Premium
('b3fb9a02-4736-4813-9925-1a76242eec48', 'b363b32b-04b9-427a-a4aa-0d61bbf4b665', 100000.00, '💎 Jackpot R$ 100.000', 0.0001, NULL),
('2963ab2b-3f6e-4a6c-8814-7524e9f52905', 'b363b32b-04b9-427a-a4aa-0d61bbf4b665', 10000.00, '🏆 R$ 10.000', 0.0010, NULL),
('945257a8-bc93-4eb4-b56a-55fd8757ffae', 'b363b32b-04b9-427a-a4aa-0d61bbf4b665', 1000.00, '🪙 R$ 1.000', 0.0100, NULL),
('a169103a-dbb6-4d18-ab03-054c77290bf8', 'b363b32b-04b9-427a-a4aa-0d61bbf4b665', 200.00, '💰 R$ 200', 0.0500, NULL),
('a154f92e-1a45-42a6-8ce3-28abff97f2ea', 'b363b32b-04b9-427a-a4aa-0d61bbf4b665', 50.00, '🔑 R$ 50', 0.1000, NULL),
('aebe7294-96e6-4b1d-bd45-83c8f9a37bcc', 'b363b32b-04b9-427a-a4aa-0d61bbf4b665', 20.00, 'R$ 20', 0.2000, NULL),
('5e2f9b67-d84b-4ac7-8412-4357af675659', 'b363b32b-04b9-427a-a4aa-0d61bbf4b665', 0.00, 'Tente de novo', 0.6389, NULL),
-- Lucky Animals
('8a4c3193-9566-48e6-a7d8-a2cdaab8f3aa', '7f826289-28ab-4dfc-82b7-7b60c8ee83a3', 5000.00, '🐼 R$ 5.000', 0.0010, NULL),
('fd47273b-c809-406f-8d0e-1b8aa8367e61', '7f826289-28ab-4dfc-82b7-7b60c8ee83a3', 1000.00, '🦊 R$ 1.000', 0.0050, NULL),
('89120bdd-28f3-4ac3-a552-2ffa3ccabdbd', '7f826289-28ab-4dfc-82b7-7b60c8ee83a3', 200.00, '🐸 R$ 200', 0.0200, NULL),
('6bd3c1e5-07cb-498b-90e1-d609dfda192e', '7f826289-28ab-4dfc-82b7-7b60c8ee83a3', 50.00, '🦉 R$ 50', 0.1000, NULL),
('bfd1a8ab-7018-459d-87d0-cb01b34f6dbf', '7f826289-28ab-4dfc-82b7-7b60c8ee83a3', 25.00, '🐠 R$ 25', 0.2000, NULL),
('bfeb51f1-5d3a-4002-9d7b-2fb4ffe93f89', '7f826289-28ab-4dfc-82b7-7b60c8ee83a3', 10.00, 'R$ 10', 0.3000, NULL),
('6b37eea2-26ca-4766-ab18-9d5b5ed2f0f0', '7f826289-28ab-4dfc-82b7-7b60c8ee83a3', 0.00, 'Tente de novo', 0.3740, NULL),
-- Vegas Lights
('259caced-d73f-463c-9957-edadab44ae00', 'abf12dce-d1db-48ec-92ff-8fb9d361275c', 200000.00, '🎰 Jackpot R$ 200.000', 0.0001, NULL),
('54237904-3e5a-4ec2-b091-4a99e05cdaf0', 'abf12dce-d1db-48ec-92ff-8fb9d361275c', 20000.00, '🎲 R$ 20.000', 0.0010, NULL),
('0c4b6fab-e90f-4b17-a2e1-c16340d67e12', 'abf12dce-d1db-48ec-92ff-8fb9d361275c', 2000.00, '🎶 R$ 2.000', 0.0100, NULL),
('2eafffec-c11f-4917-b877-b6c7ac278a62', 'abf12dce-d1db-48ec-92ff-8fb9d361275c', 500.00, '🎤 R$ 500', 0.0500, NULL),
('0d2d4b2e-3d7f-4d00-ad47-15705bc1e315', 'abf12dce-d1db-48ec-92ff-8fb9d361275c', 100.00, '🍸 R$ 100', 0.1000, NULL),
('f1b96182-4963-4285-95ec-6ba2c97ba0ab', 'abf12dce-d1db-48ec-92ff-8fb9d361275c', 40.00, 'R$ 40', 0.2000, NULL),
('3174e952-b0af-4e2a-bd95-d9370c239741', 'abf12dce-d1db-48ec-92ff-8fb9d361275c', 0.00, 'Tente de novo', 0.6389, NULL),
-- Mythic Gods
('7a30fbc4-cebb-4ee4-8669-3c0ce0249538', '2b20fcec-74c2-4846-94d2-8fda5170968a', 150000.00, '⚡ R$ 150.000', 0.0001, NULL),
('f30aaaf5-6b84-43f4-928f-c5fd860ad9e4', '2b20fcec-74c2-4846-94d2-8fda5170968a', 15000.00, '🔥 R$ 15.000', 0.0010, NULL),
('ac7cec6e-3c40-47d8-9d12-6f0e6ebad378', '2b20fcec-74c2-4846-94d2-8fda5170968a', 1500.00, '🪓 R$ 1.500', 0.0100, NULL),
('bb9e427f-cb0e-4b8c-807f-275b7de9d09d', '2b20fcec-74c2-4846-94d2-8fda5170968a', 300.00, '🐍 R$ 300', 0.0500, NULL),
('4d696c62-9496-419b-8844-48a9ebeb6372', '2b20fcec-74c2-4846-94d2-8fda5170968a', 75.00, '👑 R$ 75', 0.1000, NULL),
('b7c4a783-7b2e-4ce1-abb7-1fb5c221e5f3', '2b20fcec-74c2-4846-94d2-8fda5170968a', 30.00, 'R$ 30', 0.2000, NULL),
('ad5fa628-5367-4fb8-875b-60cbe6afb8fa', '2b20fcec-74c2-4846-94d2-8fda5170968a', 0.00, 'Tente de novo', 0.6389, NULL),
-- Crypto Scratch
('7cf5ed64-1cf7-4d8d-a131-defe26a1ae62', 'b8d33151-4c10-4986-bd0f-f1e54b976d5f', 250000.00, '🚀 To the Moon R$ 250.000', 0.0001, NULL),
('909c1a06-57f0-4241-9ebf-1260bdd9e043', 'b8d33151-4c10-4986-bd0f-f1e54b976d5f', 25000.00, '₿ R$ 25.000', 0.0010, NULL),
('def2bb80-1c56-4f96-b1a5-ad2e0e0d57be', 'b8d33151-4c10-4986-bd0f-f1e54b976d5f', 2500.00, 'Ξ R$ 2.500', 0.0100, NULL),
('c27b3176-88c5-4f0a-9fb3-c8a198145955', 'b8d33151-4c10-4986-bd0f-f1e54b976d5f', 500.00, '💎 R$ 500', 0.0500, NULL),
('cd19346d-69d8-4f15-a16a-5062be8bda31', 'b8d33151-4c10-4986-bd0f-f1e54b976d5f', 125.00, '🌕 R$ 125', 0.1000, NULL),
('3f41d854-eaf0-4211-b2b3-81c2365c84c0', 'b8d33151-4c10-4986-bd0f-f1e54b976d5f', 50.00, 'R$ 50', 0.2000, NULL),
('5fb37957-7358-499f-be98-d0fea462f80e', 'b8d33151-4c10-4986-bd0f-f1e54b976d5f', 0.00, 'Tente de novo', 0.6389, NULL),
-- Candy Mania
('f87e3468-6ae0-45bd-a63e-829c8570e08e', 'ffc3936e-e916-484c-8a7c-81c8e4abec6b', 1000.00, '🍭 R$ 1.000', 0.0010, NULL),
('0dc307d1-a26e-457a-a611-4dafedbdd371', 'ffc3936e-e916-484c-8a7c-81c8e4abec6b', 200.00, '🍩 R$ 200', 0.0050, NULL),
('2fa03ca9-0dae-45c1-93a6-4cebaa07242e', 'ffc3936e-e916-484c-8a7c-81c8e4abec6b', 50.00, '🍪 R$ 50', 0.0200, NULL),
('9d7251b4-4506-49b7-9458-bf6a8120780b', 'ffc3936e-e916-484c-8a7c-81c8e4abec6b', 10.00, '🍫 R$ 10', 0.1000, NULL),
('b8b6cb28-6612-4ad0-b425-e4bcb8c64e92', 'ffc3936e-e916-484c-8a7c-81c8e4abec6b', 5.00, '🍬 R$ 5', 0.2000, NULL),
('f1afa8e5-78f7-4c11-82ee-e3b151fef91e', 'ffc3936e-e916-484c-8a7c-81c8e4abec6b', 2.00, 'R$ 2', 0.3000, NULL),
('2b781d58-a295-4deb-a03d-1e546e582255', 'ffc3936e-e916-484c-8a7c-81c8e4abec6b', 0.00, 'Tente de novo', 0.3740, NULL);

-- Constraints
ALTER TABLE ONLY affiliates ADD CONSTRAINT affiliates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY bonuses ADD CONSTRAINT bonuses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY commissions ADD CONSTRAINT commissions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY deliveries ADD CONSTRAINT deliveries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY prizes ADD CONSTRAINT prizes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY purchases ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);
ALTER TABLE ONLY raspadinhas ADD CONSTRAINT raspadinhas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY referrals ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);
ALTER TABLE ONLY session ADD CONSTRAINT session_pkey PRIMARY KEY (sid);
ALTER TABLE ONLY transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY wallets ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);

-- Unique constraints
ALTER TABLE ONLY affiliates ADD CONSTRAINT affiliates_referral_code_unique UNIQUE (referral_code);
ALTER TABLE ONLY affiliates ADD CONSTRAINT affiliates_user_id_unique UNIQUE (user_id);
ALTER TABLE ONLY raspadinhas ADD CONSTRAINT raspadinhas_slug_unique UNIQUE (slug);
ALTER TABLE ONLY users ADD CONSTRAINT users_username_unique UNIQUE (username);
ALTER TABLE ONLY wallets ADD CONSTRAINT wallets_user_id_unique UNIQUE (user_id);

-- Foreign keys
ALTER TABLE ONLY affiliates ADD CONSTRAINT affiliates_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE ONLY bonuses ADD CONSTRAINT bonuses_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE ONLY commissions ADD CONSTRAINT commissions_affiliate_id_affiliates_id_fk FOREIGN KEY (affiliate_id) REFERENCES affiliates(id);
ALTER TABLE ONLY commissions ADD CONSTRAINT commissions_referral_id_referrals_id_fk FOREIGN KEY (referral_id) REFERENCES referrals(id);
ALTER TABLE ONLY commissions ADD CONSTRAINT commissions_transaction_id_transactions_id_fk FOREIGN KEY (transaction_id) REFERENCES transactions(id);
ALTER TABLE ONLY deliveries ADD CONSTRAINT deliveries_purchase_id_purchases_id_fk FOREIGN KEY (purchase_id) REFERENCES purchases(id);
ALTER TABLE ONLY deliveries ADD CONSTRAINT deliveries_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE ONLY prizes ADD CONSTRAINT prizes_raspadinha_id_raspadinhas_id_fk FOREIGN KEY (raspadinha_id) REFERENCES raspadinhas(id);
ALTER TABLE ONLY purchases ADD CONSTRAINT purchases_raspadinha_id_raspadinhas_id_fk FOREIGN KEY (raspadinha_id) REFERENCES raspadinhas(id);
ALTER TABLE ONLY purchases ADD CONSTRAINT purchases_transaction_id_transactions_id_fk FOREIGN KEY (transaction_id) REFERENCES transactions(id);
ALTER TABLE ONLY purchases ADD CONSTRAINT purchases_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE ONLY referrals ADD CONSTRAINT referrals_affiliate_id_affiliates_id_fk FOREIGN KEY (affiliate_id) REFERENCES affiliates(id);
ALTER TABLE ONLY referrals ADD CONSTRAINT referrals_referred_user_id_users_id_fk FOREIGN KEY (referred_user_id) REFERENCES users(id);
ALTER TABLE ONLY transactions ADD CONSTRAINT transactions_affiliate_id_fkey FOREIGN KEY (affiliate_id) REFERENCES affiliates(id);
ALTER TABLE ONLY transactions ADD CONSTRAINT transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE ONLY wallets ADD CONSTRAINT wallets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id);