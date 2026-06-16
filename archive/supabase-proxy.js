const net = require('net');
const HOST = 'db.jebixydqpvsegvrtfmgm.supabase.co';
const PORT = 5432;
const LOCAL = 15432;

const server = net.createServer(c => {
  const t = net.connect(PORT, HOST, () => { c.pipe(t); t.pipe(c); });
  t.on('error', e => { console.error('ERR:', e.message); c.destroy(); });
  c.on('error', () => { t.destroy(); });
  c.on('close', () => t.destroy());
  t.on('close', () => c.destroy());
});
server.listen(LOCAL, '0.0.0.0', () => console.log('TCP proxy on :' + LOCAL));
