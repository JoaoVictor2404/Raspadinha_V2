-- MySQL 8 schema for LUDIX

-- recommended: set SQL mode
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE users (
  id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  username      VARCHAR(255) NOT NULL,
  password      VARCHAR(255) NOT NULL,
  email         VARCHAR(255),
  name          VARCHAR(255),
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_username_unique (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE affiliates (
  id                  VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id             VARCHAR(36)  NOT NULL,
  referral_code       TEXT         NOT NULL,
  total_referrals     INT          NOT NULL DEFAULT 0,
  active_referrals    INT          NOT NULL DEFAULT 0,
  commission_balance  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY affiliates_user_id_unique (user_id),
  UNIQUE KEY affiliates_referral_code_unique (referral_code(191)),
  CONSTRAINT affiliates_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE wallets (
  id               VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  user_id          VARCHAR(36)   NOT NULL,
  balance_total    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  balance_standard DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  balance_prizes   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  balance_bonus    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY wallets_user_id_unique (user_id),
  CONSTRAINT wallets_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- categories como ENUM por coluna
CREATE TABLE raspadinhas (
  id          VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  slug        VARCHAR(255)  NOT NULL,
  title       VARCHAR(255)  NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,
  image_url   TEXT,
  category    ENUM('gold-rush','lucky-animals','vegas-lights','mythic-gods','crypto-scratch','candy-mania') NOT NULL DEFAULT 'gold-rush',
  max_prize   DECIMAL(10,2) NOT NULL,
  badge       VARCHAR(255),
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  stock       INT           NOT NULL DEFAULT 1000,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY raspadinhas_slug_unique (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE prizes (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  raspadinha_id VARCHAR(36)   NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  label         VARCHAR(255)  NOT NULL,
  probability   DECIMAL(5,4)  NOT NULL,
  image_url     TEXT,
  PRIMARY KEY (id),
  KEY prizes_rasp_fk (raspadinha_id),
  CONSTRAINT prizes_rasp_fk FOREIGN KEY (raspadinha_id) REFERENCES raspadinhas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE transactions (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  user_id       VARCHAR(36)   NOT NULL,
  type          ENUM('deposit','withdrawal','purchase','prize','bonus','commission') NOT NULL,
  status        ENUM('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
  amount        DECIMAL(10,2) NOT NULL,
  description   TEXT,
  pix_code      TEXT,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  affiliate_id  VARCHAR(36),
  PRIMARY KEY (id),
  KEY tx_user_fk (user_id),
  KEY tx_aff_fk (affiliate_id),
  CONSTRAINT transactions_user_fk FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT transactions_affiliate_fk FOREIGN KEY (affiliate_id) REFERENCES affiliates(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE purchases (
  id             VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  user_id        VARCHAR(36)   NOT NULL,
  raspadinha_id  VARCHAR(36)   NOT NULL,
  transaction_id VARCHAR(36),
  prize_won      DECIMAL(10,2),
  prize_label    VARCHAR(255),
  is_revealed    TINYINT(1)    NOT NULL DEFAULT 0,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY p_user_fk (user_id),
  KEY p_rasp_fk (raspadinha_id),
  KEY p_tx_fk (transaction_id),
  CONSTRAINT purchases_user_fk FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT purchases_rasp_fk FOREIGN KEY (raspadinha_id) REFERENCES raspadinhas(id),
  CONSTRAINT purchases_tx_fk FOREIGN KEY (transaction_id) REFERENCES transactions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE deliveries (
  id           VARCHAR(36) NOT NULL DEFAULT (UUID()),
  user_id      VARCHAR(36) NOT NULL,
  purchase_id  VARCHAR(36) NOT NULL,
  status       ENUM('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  address      TEXT,
  tracking_code TEXT,
  created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY d_user_fk (user_id),
  KEY d_purchase_fk (purchase_id),
  CONSTRAINT deliveries_user_fk FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT deliveries_purchase_fk FOREIGN KEY (purchase_id) REFERENCES purchases(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE referrals (
  id                VARCHAR(36) NOT NULL DEFAULT (UUID()),
  affiliate_id      VARCHAR(36) NOT NULL,
  referred_user_id  VARCHAR(36) NOT NULL,
  is_active         TINYINT(1)  NOT NULL DEFAULT 1,
  created_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY r_aff_fk (affiliate_id),
  KEY r_user_fk (referred_user_id),
  CONSTRAINT referrals_aff_fk FOREIGN KEY (affiliate_id) REFERENCES affiliates(id),
  CONSTRAINT referrals_user_fk FOREIGN KEY (referred_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE commissions (
  id             VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  affiliate_id   VARCHAR(36)   NOT NULL,
  referral_id    VARCHAR(36)   NOT NULL,
  transaction_id VARCHAR(36)   NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  percentage     DECIMAL(5,2)  NOT NULL,
  is_paid        TINYINT(1)    NOT NULL DEFAULT 0,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY c_aff_fk (affiliate_id),
  KEY c_ref_fk (referral_id),
  KEY c_tx_fk (transaction_id),
  CONSTRAINT commissions_aff_fk FOREIGN KEY (affiliate_id) REFERENCES affiliates(id),
  CONSTRAINT commissions_ref_fk FOREIGN KEY (referral_id) REFERENCES referrals(id),
  CONSTRAINT commissions_tx_fk  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE bonuses (
  id          VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  user_id     VARCHAR(36)   NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  type        VARCHAR(255)  NOT NULL,
  status      VARCHAR(255)  NOT NULL DEFAULT 'pending',
  description TEXT,
  expires_at  DATETIME,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY b_user_fk (user_id),
  CONSTRAINT bonuses_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- (Opcional) Tabela de sessão SE você não for usar express-mysql-session auto:
-- CREATE TABLE session (
--   sid     VARCHAR(255) PRIMARY KEY,
--   sess    JSON NOT NULL,
--   expire  DATETIME NOT NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====== SEED (ajuste: aspas, datas compatíveis, enums iguais) ======
INSERT INTO raspadinhas (id, slug, title, description, price, image_url, category, max_prize, badge, is_active, stock, created_at) VALUES
('99c12334-5efc-4dce-80d3-a50c5cd43e6e','gold-rush-basico','Gold Rush Básico','Ganhe até R$ 2.000 💰🪙',2.00,'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400','gold-rush',2000.00,'Popular',1,1000,'2025-10-16 23:19:02'),
('b363b32b-04b9-427a-a4aa-0d61bbf4b665','gold-rush-premium','Gold Rush Premium','Jackpot 1000x - Ganhe até R$ 100.000 💎🏆',10.00,'https://images.unsplash.com/photo-1533327325824-76bc4e62d560?w=400','gold-rush',100000.00,'Jackpot',1,1000,'2025-10-16 23:19:02'),
('7f826289-28ab-4dfc-82b7-7b60c8ee83a3','lucky-animals','Lucky Animals','Animais da sorte te trazem prêmios 🐼🦊',5.00,'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400','lucky-animals',5000.00,'+Chance',1,1000,'2025-10-16 23:19:02'),
('abf12dce-d1db-48ec-92ff-8fb9d361275c','vegas-lights','Vegas Lights','Cassino de Las Vegas em suas mãos 🎰🎲',20.00,'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400','vegas-lights',200000.00,'Premium',1,1000,'2025-10-16 23:19:02'),
('2b20fcec-74c2-4846-94d2-8fda5170968a','mythic-gods','Mythic Gods','Poder dos deuses mitológicos ⚡🔥',15.00,'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400','mythic-gods',150000.00,'Novo',1,1000,'2025-10-16 23:19:02'),
('b8d33151-4c10-4986-bd0f-f1e54b976d5f','crypto-scratch','Crypto Scratch','To the moon! 🚀🌕 - Jackpot 1000x',25.00,'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400','crypto-scratch',250000.00,'Exclusivo',1,1000,'2025-10-16 23:19:02'),
('ffc3936e-e916-484c-8a7c-81c8e4abec6b','candy-mania','Candy Mania','Doce sorte te espera 🍭🍬',1.00,'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400','candy-mania',1000.00,'Iniciante',1,1000,'2025-10-16 23:19:02');

INSERT INTO prizes (id,raspadinha_id,amount,label,probability,image_url) VALUES
('d9a0dca6-3269-4f36-af52-9ddb175976f7','99c12334-5efc-4dce-80d3-a50c5cd43e6e',2000.00,'💎 R$ 2.000',0.0010,NULL),
('79edf037-f91b-49ca-8ac4-b7e389187ce6','99c12334-5efc-4dce-80d3-a50c5cd43e6e',500.00,'🏆 R$ 500',0.0050,NULL),
('f6c4c375-8cec-45f9-bd24-c47ac937192c','99c12334-5efc-4dce-80d3-a50c5cd43e6e',100.00,'🪙 R$ 100',0.0200,NULL),
('34b802fe-e2dd-418f-bd11-b0af1ccc0b39','99c12334-5efc-4dce-80d3-a50c5cd43e6e',20.00,'💰 R$ 20',0.1000,NULL),
('2e4d5411-bb70-4644-8c98-9ba64f4de14c','99c12334-5efc-4dce-80d3-a50c5cd43e6e',10.00,'🔑 R$ 10',0.2000,NULL),
('5d79a5fa-76d0-4fa1-9d74-c60560d8acc6','99c12334-5efc-4dce-80d3-a50c5cd43e6e',4.00,'R$ 4',0.3000,NULL),
('4ab4a00c-51b3-44e5-823b-816c778bac7e','99c12334-5efc-4dce-80d3-a50c5cd43e6e',0.00,'Tente de novo',0.3740,NULL),

('b3fb9a02-4736-4813-9925-1a76242eec48','b363b32b-04b9-427a-a4aa-0d61bbf4b665',100000.00,'💎 Jackpot R$ 100.000',0.0001,NULL),
('2963ab2b-3f6e-4a6c-8814-7524e9f52905','b363b32b-04b9-427a-a4aa-0d61bbf4b665',10000.00,'🏆 R$ 10.000',0.0010,NULL),
('945257a8-bc93-4eb4-b56a-55fd8757ffae','b363b32b-04b9-427a-a4aa-0d61bbf4b665',1000.00,'🪙 R$ 1.000',0.0100,NULL),
('a169103a-dbb6-4d18-ab03-054c77290bf8','b363b32b-04b9-427a-a4aa-0d61bbf4b665',200.00,'💰 R$ 200',0.0500,NULL),
('a154f92e-1a45-42a6-8ce3-28abff97f2ea','b363b32b-04b9-427a-a4aa-0d61bbf4b665',50.00,'🔑 R$ 50',0.1000,NULL),
('aebe7294-96e6-4b1d-bd45-83c8f9a37bcc','b363b32b-04b9-427a-a4aa-0d61bbf4b665',20.00,'R$ 20',0.2000,NULL),
('5e2f9b67-d84b-4ac7-8412-4357af675659','b363b32b-04b9-427a-a4aa-0d61bbf4b665',0.00,'Tente de novo',0.6389,NULL),

('8a4c3193-9566-48e6-a7d8-a2cdaab8f3aa','7f826289-28ab-4dfc-82b7-7b60c8ee83a3',5000.00,'🐼 R$ 5.000',0.0010,NULL),
('fd47273b-c809-406f-8d0e-1b8aa8367e61','7f826289-28ab-4dfc-82b7-7b60c8ee83a3',1000.00,'🦊 R$ 1.000',0.0050,NULL),
('89120bdd-28f3-4ac3-a552-2ffa3ccabdbd','7f826289-28ab-4dfc-82b7-7b60c8ee83a3',200.00,'🐸 R$ 200',0.0200,NULL),
('6bd3c1e5-07cb-498b-90e1-d609dfda192e','7f826289-28ab-4dfc-82b7-7b60c8ee83a3',50.00,'🦉 R$ 50',0.1000,NULL),
('bfd1a8ab-7018-459d-87d0-cb01b34f6dbf','7f826289-28ab-4dfc-82b7-7b60c8ee83a3',25.00,'🐠 R$ 25',0.2000,NULL),
('bfeb51f1-5d3a-4002-9d7b-2fb4ffe93f89','7f826289-28ab-4dfc-82b7-7b60c8ee83a3',10.00,'R$ 10',0.3000,NULL),
('6b37eea2-26ca-4766-ab18-9d5b5ed2f0f0','7f826289-28ab-4dfc-82b7-7b60c8ee83a3',0.00,'Tente de novo',0.3740,NULL),

('259caced-d73f-463c-9957-edadab44ae00','abf12dce-d1db-48ec-92ff-8fb9d361275c',200000.00,'🎰 Jackpot R$ 200.000',0.0001,NULL),
('54237904-3e5a-4ec2-b091-4a99e05cdaf0','abf12dce-d1db-48ec-92ff-8fb9d361275c',20000.00,'🎲 R$ 20.000',0.0010,NULL),
('0c4b6fab-e90f-4b17-a2e1-c16340d67e12','abf12dce-d1db-48ec-92ff-8fb9d361275c',2000.00,'🎶 R$ 2.000',0.0100,NULL),
('2eafffec-c11f-4917-b877-b6c7ac278a62','abf12dce-d1db-48ec-92ff-8fb9d361275c',500.00,'🎤 R$ 500',0.0500,NULL),
('0d2d4b2e-3d7f-4d00-ad47-15705bc1e315','abf12dce-d1db-48ec-92ff-8fb9d361275c',100.00,'🍸 R$ 100',0.1000,NULL),
('f1b96182-4963-4285-95ec-6ba2c97ba0ab','abf12dce-d1db-48ec-92ff-8fb9d361275c',40.00,'R$ 40',0.2000,NULL),
('3174e952-b0af-4e2a-bd95-d9370c239741','abf12dce-d1db-48ec-92ff-8fb9d361275c',0.00,'Tente de novo',0.6389,NULL),

('7a30fbc4-cebb-4ee4-8669-3c0ce0249538','2b20fcec-74c2-4846-94d2-8fda5170968a',150000.00,'⚡ R$ 150.000',0.0001,NULL),
('f30aaaf5-6b84-43f4-928f-c5fd860ad9e4','2b20fcec-74c2-4846-94d2-8fda5170968a',15000.00,'🔥 R$ 15.000',0.0010,NULL),
('ac7cec6e-3c40-47d8-9d12-6f0e6ebad378','2b20fcec-74c2-4846-94d2-8fda5170968a',1500.00,'🪓 R$ 1.500',0.0100,NULL),
('bb9e427f-cb0e-4b8c-807f-275b7de9d09d','2b20fcec-74c2-4846-94d2-8fda5170968a',300.00,'🐍 R$ 300',0.0500,NULL),
('4d696c62-9496-419b-8844-48a9ebeb6372','2b20fcec-74c2-4846-94d2-8fda5170968a',75.00,'👑 R$ 75',0.1000,NULL),
('b7c4a783-7b2e-4ce1-abb7-1fb5c221e5f3','2b20fcec-74c2-4846-94d2-8fda5170968a',30.00,'R$ 30',0.2000,NULL),
('ad5fa628-5367-4fb8-875b-60cbe6afb8fa','2b20fcec-74c2-4846-94d2-8fda5170968a',0.00,'Tente de novo',0.6389,NULL),

('7cf5ed64-1cf7-4d8d-a131-defe26a1ae62','b8d33151-4c10-4986-bd0f-f1e54b976d5f',250000.00,'🚀 To the Moon R$ 250.000',0.0001,NULL),
('909c1a06-57f0-4241-9ebf-1260bdd9e043','b8d33151-4c10-4986-bd0f-f1e54b976d5f',25000.00,'₿ R$ 25.000',0.0010,NULL),
('def2bb80-1c56-4f96-b1a5-ad2e0e0d57be','b8d33151-4c10-4986-bd0f-f1e54b976d5f',2500.00,'Ξ R$ 2.500',0.0100,NULL),
('c27b3176-88c5-4f0a-9fb3-c8a198145955','b8d33151-4c10-4986-bd0f-f1e54b976d5f',500.00,'💎 R$ 500',0.0500,NULL),
('cd19346d-69d8-4f15-a16a-5062be8bda31','b8d33151-4c10-4986-bd0f-f1e54b976d5f',125.00,'🌕 R$ 125',0.1000,NULL),
('3f41d854-eaf0-4211-b2b3-81c2365c84c0','b8d33151-4c10-4986-bd0f-f1e54b976d5f',50.00,'R$ 50',0.2000,NULL),
('5fb37957-7358-499f-be98-d0fea462f80e','b8d33151-4c10-4986-bd0f-f1e54b976d5f',0.00,'Tente de novo',0.6389,NULL),

('f87e3468-6ae0-45bd-a63e-829c8570e08e','ffc3936e-e916-484c-8a7c-81c8e4abec6b',1000.00,'🍭 R$ 1.000',0.0010,NULL),
('0dc307d1-a26e-457a-a611-4dafedbdd371','ffc3936e-e916-484c-8a7c-81c8e4abec6b',200.00,'🍩 R$ 200',0.0050,NULL),
('2fa03ca9-0dae-45c1-93a6-4cebaa07242e','ffc3936e-e916-484c-8a7c-81c8e4abec6b',50.00,'🍪 R$ 50',0.0200,NULL),
('9d7251b4-4506-49b7-9458-bf6a8120780b','ffc3936e-e916-484c-8a7c-81c8e4abec6b',10.00,'🍫 R$ 10',0.1000,NULL),
('b8b6cb28-6612-4ad0-b425-e4bcb8c64e92','ffc3936e-e916-484c-8a7c-81c8e4abec6b',5.00,'🍬 R$ 5',0.2000,NULL),
('f1afa8e5-78f7-4c11-82ee-e3b151fef91e','ffc3936e-e916-484c-8a7c-81c8e4abec6b',2.00,'R$ 2',0.3000,NULL),
('2b781d58-a295-4deb-a03d-1e546e582255','ffc3936e-e916-484c-8a7c-81c8e4abec6b',0.00,'Tente de novo',0.3740,NULL);