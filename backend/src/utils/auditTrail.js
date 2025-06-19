exports.appendAuditTrail = (currentTrail, action, userId) => {
  const entry = {
    action,
    user_id: userId,
    timestamp: new Date().toISOString()
  };
  return [...(currentTrail || []), entry];
};