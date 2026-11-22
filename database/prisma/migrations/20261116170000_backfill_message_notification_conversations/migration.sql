-- Only link legacy notifications when the sender, recipient, and creation time
-- identify exactly one conversation. Ambiguous notifications remain unchanged.
WITH candidates AS (
  SELECT n.id, (array_agg(DISTINCT m.conversation_id))[1] AS conversation_id
  FROM notifications n
  JOIN messages m ON m.sent_at BETWEEN n.created_at - INTERVAL '5 seconds' AND n.created_at + INTERVAL '5 seconds'
  JOIN users u ON u.id = m.sender_user_id
    AND n.body = 'New message from ' || trim(concat_ws(' ', u.first_name, u.last_name)) || '.'
  JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = n.user_id
  WHERE n.notification_type = 'message' AND n.conversation_id IS NULL
  GROUP BY n.id
  HAVING count(DISTINCT m.conversation_id) = 1
)
UPDATE notifications n SET conversation_id = candidates.conversation_id
FROM candidates WHERE n.id = candidates.id AND n.conversation_id IS NULL;
