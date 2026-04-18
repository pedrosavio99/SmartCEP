-- Tabela de cache de CEPs
CREATE TABLE IF NOT EXISTS cep_cache (
  cep VARCHAR(9) PRIMARY KEY,
  logradouro VARCHAR(255),
  complemento VARCHAR(255),
  bairro VARCHAR(100),
  localidade VARCHAR(100),
  uf VARCHAR(2),
  ibge VARCHAR(10),
  gia VARCHAR(10),
  ddd VARCHAR(3),
  siafi VARCHAR(10),
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de endereços salvos (CRUD)
CREATE TABLE IF NOT EXISTS addresses (
  id SERIAL PRIMARY KEY,
  cep VARCHAR(9) NOT NULL,
  apelido VARCHAR(100) NOT NULL,
  logradouro VARCHAR(255),
  complemento VARCHAR(255),
  bairro VARCHAR(100),
  localidade VARCHAR(100),
  uf VARCHAR(2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para buscas rápidas por CEP
CREATE INDEX IF NOT EXISTS idx_cep_cache ON cep_cache(cep);
CREATE INDEX IF NOT EXISTS idx_addresses_cep ON addresses(cep);