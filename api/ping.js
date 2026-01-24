// Pure JavaScript endpoint - no TypeScript compilation needed

module.exports = async function handler(req, res) {
  res.status(200).json({ 
    status: 'ok',
    message: 'Ping successful!',
    timestamp: new Date().toISOString()
  });
};
