exports.logAction = (action, details = {}) => {
  const logEntry = {
    action,
    timestamp: new Date().toISOString(),
    ...details
  };
  console.log(JSON.stringify(logEntry));
};