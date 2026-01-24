// Pure JavaScript endpoint - no TypeScript compilation needed

module.exports = async function handler(request) {
  return new Response(JSON.stringify({ 
    status: 'ok',
    message: 'Ping successful!',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
