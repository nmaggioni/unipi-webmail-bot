const winston = require('winston');
const {existsSync, readFileSync} = require("fs");
const secrets = (() => {
  if (existsSync('./secrets.local.json')) {
    winston.info('Trovati secret locali, carico "secrets.local.json".');
    // noinspection JSFileReferences
    return require('./secrets.local.json');
  } else if (existsSync('./secrets.json')) {
    winston.info('Secret locali non trovati, carico "secrets.json".');
    // noinspection JSFileReferences
    return require('./secrets.json');
  }
  winston.error('Nessun file "secrets.local.json" o "secrets.json" trovato!');
  process.exit(1);
})();

function load() {
  let keys = Object.keys(secrets);
  keys.forEach((el) => {
    if (process.env.hasOwnProperty(el.toUpperCase())) {
      winston.info(`Usata variabile d'ambiente ${el.toUpperCase()}.`);
      secrets[el] = process.env[el.toUpperCase()];
    } else if (existsSync('/run/secrets/' + el)) {
      winston.info(`Usato secret dell'orchestrator "/run/secrets/${el}".`);
      secrets[el] = readFileSync('/run/secrets/' + el);
    }
  });
  return secrets;
}

module.exports = {
  load: load
};
