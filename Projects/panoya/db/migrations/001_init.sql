-- Panoya: katılımcılar, adım yanıtları (jsPsych'teki "ekran başına bir satır" modeli), olaylar,
-- kişisel iletişim bilgileri (yanıtlardan ayrı) ve önceden üretilmiş bloklu koşul atama sırası.

CREATE TABLE IF NOT EXISTS participants (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text NOT NULL UNIQUE,
  module            text NOT NULL CHECK (module IN ('A','B')),
  condition         text NOT NULL CHECK (condition IN ('ret','sahte','ghosting')),
  assignment_method text NOT NULL CHECK (assignment_method IN ('blok','manuel')),
  allocation_id     bigint,
  is_test           boolean NOT NULL DEFAULT false,
  fast_mode         boolean NOT NULL DEFAULT false,
  show_notes        boolean NOT NULL DEFAULT false,
  round_order       text[],                -- Modül A: 4 tur ilanının katılımcıya özgü sırası
  chosen_ad         text,                  -- Modül B: seçilen ilan
  step_index        integer NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'olusturuldu' CHECK (status IN ('olusturuldu','devam','tamamlandi','iptal')),
  label             text,                  -- araştırmacı notu (ör. laboratuvar oturumu); kişisel veri yazmayınız
  created_at        timestamptz NOT NULL DEFAULT now(),
  started_at        timestamptz,
  completed_at      timestamptz,
  last_seen_at      timestamptz,
  CHECK (is_test OR (NOT fast_mode))       -- gerçek katılımcıda süreler kısaltılamaz
);
CREATE INDEX IF NOT EXISTS participants_module_idx ON participants (module, is_test, status);

CREATE TABLE IF NOT EXISTS responses (
  id            bigserial PRIMARY KEY,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  step_id       text NOT NULL,
  step_index    integer NOT NULL,
  data          jsonb NOT NULL,
  started_at    timestamptz,
  finished_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_id, step_id)
);

CREATE TABLE IF NOT EXISTS events (
  id             bigserial PRIMARY KEY,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  type           text NOT NULL,
  step_id        text,
  payload        jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_ts      timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_participant_idx ON events (participant_id, created_at);

-- Kişisel veri: yalnızca Modül B başvuru formundaki ad ve e-posta. Dışa aktarıma girmez.
CREATE TABLE IF NOT EXISTS contacts (
  participant_id uuid PRIMARY KEY REFERENCES participants(id) ON DELETE CASCADE,
  full_name      text,
  email          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Bloklu rastgele atama: her katman (stratum) için 3'lü bloklar halinde önceden üretilen sıra.
CREATE TABLE IF NOT EXISTS allocations (
  id          bigserial PRIMARY KEY,
  stratum     text NOT NULL,
  seq         integer NOT NULL,
  block_no    integer NOT NULL,
  condition   text NOT NULL CHECK (condition IN ('ret','sahte','ghosting')),
  used_by     uuid REFERENCES participants(id) ON DELETE SET NULL,
  used_at     timestamptz,
  UNIQUE (stratum, seq)
);
