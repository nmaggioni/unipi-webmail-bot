const winston = require('winston');
const Telegraf = require('telegraf');
const commandParts = require('telegraf-command-parts');
const CronJob = require('cron').CronJob;
const secrets = require('./lib/secrets').load();
const {getUnreadMessages} = require('./lib/scraper');
const hashTracker = require('./lib/hashTracker');

let job;

const webmailLinkKeyboard = Telegraf.Extra
  .markdown()
  .markup((m) => m.inlineKeyboard([
    Telegraf.Markup.urlButton('Apri WebMail', 'https://webmail.studenti.unipi.it/horde/imp/')
  ]));

async function checkSecrets() {
  if (!secrets.telegram_token) {
    throw 'Non hai configurato il token del bot Telegram.';
  }
  if (!secrets.telegram_password) {
    throw 'Non hai configurato la password per il bot Telegram.';
  }
}

function formatNewMessage(message) {
  return 'Hai un nuovo messaggio! 📬\n\n' +
    `*Mittente*: ${message.from}\n` +
    `*Oggetto*: ${message.subject}\n` +
    `*Dimensione*: ${message.size}`
}

async function setCronjob(bot, chatid) {
  async function doCronjob() {
    winston.info('Running cronjob for chat ID', chatid, '...');
    let unseen = (await getUnreadMessages(secrets));
    if (unseen.length > 0) {
      for (let i = 0; i < unseen.length; i++) {
        let msg = formatNewMessage(unseen[i]);
        let msgHash = hashTracker.md5(msg);
        if (!hashTracker.isSeen(msgHash)) {
          bot.telegram.sendMessage(chatid, msg, webmailLinkKeyboard);
          hashTracker.setSeen(msgHash);
        }
      }
    }
    winston.info('Done running cronjob for chat ID', chatid, '.');
  }

  if (!job) {
    job = new CronJob({
      cronTime: '0 */15 * * * *',
      onTick: await doCronjob,
    });
  }
  job.start();
  await doCronjob();
}

checkSecrets()
  .then(() => {
    const bot = new Telegraf(secrets.telegram_token);

    bot.use(commandParts());

    bot.command('start', (ctx) => {
      let isPasswordOk = (ctx.state.command.args || '') === secrets.telegram_password;
      winston.info(ctx.chat.id, ctx.from.username, '/start', isPasswordOk ? 'PASS OK' : 'PASS KO');
      ctx.reply(isPasswordOk ? '👍✅ ⇒ 🔛' : '👎🚫');
      if (isPasswordOk) {
        setCronjob(bot, ctx.chat.id);
      }
    });

    bot.command('stop', (ctx) => {
      let isPasswordOk = (ctx.state.command.args || '') === secrets.telegram_password;
      winston.info(ctx.chat.id, ctx.from.username, '/stop', isPasswordOk ? 'PASS OK' : 'PASS KO');
      ctx.reply(isPasswordOk ? '👍✅ ⇒ 📴' : '👎🚫');
      if (isPasswordOk) {
        cleanup(false);
      }
    });

    bot.command('status', (ctx) => {
      winston.info(ctx.chat.id, ctx.from.username, '/status');
      ctx.reply((job && job.running) ? '🔛' : '📴');
    });

    bot.command('ping', (ctx) => {
      winston.info(ctx.chat.id, ctx.from.username, '/ping');
      ctx.reply('pong!');
    });

    bot.startPolling();
  })
  .catch((e) => {
    winston.error(e);
  });

// Cleanups & Promises handling

function cleanup(exit) {
  if (job && job.running) job.stop();
  if (exit) process.exit();
}

process.on('exit', () => {
  cleanup(true);
});
process.on('SIGINT', () => {
  cleanup(true);
});
process.on('SIGUSR1', () => {
  cleanup(true);
});
process.on('SIGUSR2', () => {
  cleanup(true);
});
process.on('uncaughtException', () => {
  cleanup(true);
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
