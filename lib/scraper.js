const winston = require('winston');
const puppeteer = require('puppeteer');

async function checkSecrets(secrets) {
  if (!secrets.webmail_username) {
    throw 'Non hai configurato il nome utente.';
  }
  if (!secrets.webmail_password) {
    throw 'Non hai configurato la password.';
  }
}

async function waitForPageLoad(page) {
  try {
    await page.waitForNavigation({
      waitUntil: 'networkidle'
    });
  } catch (e) {
    console.log('Timeout di connessione.');
    process.exit(1);
  }
}

async function parseMessages(page) {
  let frames = page.frames();
  let mailboxFrame = null;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < frames.length; j++) {
      if (frames[j]._url.startsWith('https://webmail.studenti.unipi.it/horde/imp/mailbox.php')) {
        mailboxFrame = frames[j];
        break;
      }
    }
    if (!mailboxFrame && i !== 2) {
      await page.reload({
        waitUntil: 'networkidle',
        networkIdleTimeout: 3000
      });
    } else {
      break;
    }
  }
  if (!mailboxFrame) {
    throw new Error('Mancanza del frame mailbox.');
  }

  try {
    await mailboxFrame.waitForSelector('table.messageList', {
      timeout: 3000
    });
  } catch (e) {
    winston.error('Timeout di rilevamento.');
    process.exit(1);
  }
  return await mailboxFrame.$eval('table.messageList', (table) => {
    let messages = [];
    for (let i = 0, row; row = table.rows[i]; i++) {
      if (row.className === 'item') {
        continue;
      }
      messages.push({
        date: row.cells[2].querySelector('div').innerHTML.replace('&nbsp;', ''),
        from: row.cells[3].querySelector('div a').innerHTML,
        subject: row.cells[4].querySelector('div a').innerHTML,
        size: row.cells[5].querySelector('div').innerHTML,
        read: row.className !== 'unseen'
      });
    }
    return messages;
  });
}

async function filterUnread(messages) {
  let unread = [];
  messages.forEach((el) => {
    if (!el.read) {
      unread.push(el);
    }
  });
  return unread;
}

async function headless(secrets) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.goto('https://webmail.studenti.unipi.it/horde/', {
    waitUntil: 'networkidle'
  });
  await page.click('#imapuser');
  await page.type(secrets.webmail_username);
  await page.click('#pass');
  await page.type(secrets.webmail_password);
  await page.click('#loginButton');
  await waitForPageLoad(page);
  try {
    await page.$('#messages');
  } catch (e) {
    winston.error(e);
    let err = await page.$eval('ul.notices li', (notice) => (!notice || notice.innerText === 'Accesso fallito'));
    if (err) {
      winston.error('Le credenziali della WebMail che hai impostato non sono valide.');
      process.exit(1);
    }
  }
  let messages = await parseMessages(page); // { date: String, from: String, subject: String, size: String, read: Bool }
  await browser.close();

  return messages;
}

// noinspection JSUnusedGlobalSymbols
module.exports = {
  getAllMessages: async function (secrets) {
    await checkSecrets(secrets);
    return await headless(secrets);
  },
  getUnreadMessages: async function (secrets) {
    await checkSecrets(secrets);
    return await filterUnread(await headless(secrets));
  }
};
