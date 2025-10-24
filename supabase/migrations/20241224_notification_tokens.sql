-- Crear tabla para almacenar tokens de notificación push
CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_notification_tokens_token ON notification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_user_id ON notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_active ON notification_tokens(is_active) WHERE is_active = true;

-- RLS (Row Level Security)
ALTER TABLE notification_tokens ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver y modificar sus propios tokens
CREATE POLICY "Users can manage their own notification tokens" ON notification_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Función para limpiar tokens inactivos antiguos (más de 30 días)
CREATE OR REPLACE FUNCTION cleanup_old_notification_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_tokens 
  WHERE is_active = false 
  AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_notification_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_tokens_updated_at
  BEFORE UPDATE ON notification_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_tokens_updated_at();
