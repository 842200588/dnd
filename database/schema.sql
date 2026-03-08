CREATE TABLE IF NOT EXISTS characters (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(64) NOT NULL UNIQUE,
  race_id VARCHAR(64) NOT NULL,
  class_id VARCHAR(64) NOT NULL,
  name VARCHAR(100) NOT NULL,
  race VARCHAR(64) NOT NULL,
  class_name VARCHAR(64) NOT NULL,
  level INT NOT NULL DEFAULT 1,
  max_hp INT NOT NULL,
  current_hp INT NOT NULL,
  armor_class INT NOT NULL DEFAULT 10,
  strength_score INT NOT NULL,
  dexterity_score INT NOT NULL,
  constitution_score INT NOT NULL,
  intelligence_score INT NOT NULL,
  wisdom_score INT NOT NULL,
  charisma_score INT NOT NULL,
  gold_amount INT NOT NULL DEFAULT 0,
  inventory_json JSON NOT NULL,
  skills_json JSON NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(64) NOT NULL UNIQUE,
  character_id BIGINT NOT NULL,
  story_summary TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_game_sessions_character
    FOREIGN KEY (character_id) REFERENCES characters(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(64) NOT NULL,
  role ENUM('system', 'assistant', 'user', 'tool') NOT NULL,
  content TEXT NOT NULL,
  tool_name VARCHAR(100) NULL,
  metadata_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_messages_session_id_created_at (session_id, created_at)
);

CREATE TABLE IF NOT EXISTS npcs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(64) NOT NULL,
  name VARCHAR(100) NOT NULL,
  race VARCHAR(64) NULL,
  class_name VARCHAR(64) NULL,
  creature_type VARCHAR(64) NULL,
  level INT NOT NULL DEFAULT 1,
  max_hp INT NOT NULL DEFAULT 1,
  current_hp INT NOT NULL DEFAULT 1,
  armor_class INT NOT NULL DEFAULT 10,
  strength_score INT NOT NULL DEFAULT 10,
  dexterity_score INT NOT NULL DEFAULT 10,
  constitution_score INT NOT NULL DEFAULT 10,
  intelligence_score INT NOT NULL DEFAULT 10,
  wisdom_score INT NOT NULL DEFAULT 10,
  charisma_score INT NOT NULL DEFAULT 10,
  inventory_json JSON NOT NULL,
  skills_json JSON NOT NULL,
  affinity INT NOT NULL DEFAULT 0,
  attitude VARCHAR(32) NOT NULL DEFAULT 'neutral',
  statuses_json JSON NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_npc_session_name (session_id, name),
  INDEX idx_npcs_session_id_updated_at (session_id, updated_at)
);

