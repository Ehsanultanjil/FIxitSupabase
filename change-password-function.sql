-- Change Password Function for Supabase
-- Verifies current password and updates to new password

CREATE OR REPLACE FUNCTION change_password(
  p_user_id UUID,
  p_current_password TEXT,
  p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_password_hash TEXT;
  v_is_valid BOOLEAN;
BEGIN
  -- Get current password hash
  SELECT password_hash INTO v_password_hash
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User not found'
    );
  END IF;

  -- Verify current password
  v_is_valid := (v_password_hash = crypt(p_current_password, v_password_hash));

  IF NOT v_is_valid THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Current password is incorrect'
    );
  END IF;

  -- Update to new password
  UPDATE users
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Password changed successfully'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION change_password(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION change_password(UUID, TEXT, TEXT) TO anon;
