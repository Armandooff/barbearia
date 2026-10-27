const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

function run(name, cwd) {
  console.log(`[${name}] iniciando em ${cwd}`);
  const proc = spawn('npm', ['run', 'dev'], {
    cwd,
    stdio: 'inherit',
    shell: true,
  });
  proc.on('exit', (code) => {
    console.log(`[${name}] finalizado (código ${code})`);
  });
  return proc;
}

console.log('Backend iniciando...');
const api = run('API', path.join(root, 'barbearia-api'));

setTimeout(() => {
  console.log('Painel admin iniciando...');
  run('ADMIN', path.join(root, 'barbearia-admin'));

  console.log('Cliente (agendamento) iniciando...');
  run('CLIENTE', path.join(root, 'barbearia-agendamento'));
}, 3000);