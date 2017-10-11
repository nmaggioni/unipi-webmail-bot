# unipi-webmail-bot
Un bot Telegram che ti avvisa quando ricevi una nuova email nella tua casella dell'Università di Pisa.

---

###### Questo progetto è in stadio embrionale, gran parte delle configurazioni deve ancora essere resa personalizzabile.

---

### Installazione dipendenze

+ Usando Yarn
  ```bash
  yarn
  ```
+ Usando NPM
  ```bash
  npm install
  ```

### Creazione bot Telegram

Segui la [documentazione ufficiale](https://core.telegram.org/bots#6-botfather) per creare un bot tramite _[@BotFather](https://telegram.me/botfather)_.

### Modifica credenziali

Le credenziali vengono estratte da uno di questi due file, elencati in ordine di precedenza:

1. `secrets.local.json`
2. `secrets.json`

Se il primo viene trovato, il secondo viene ignorato. **Almeno uno dei due deve esistere.**

È possibile sovrascrivere i parametri usando delle variabili d'ambiente chiamate come il parametro in maiuscolo (es.: `telegram_token` ⇒ `TELEGRAM_TOKEN`).

In caso si stia utilizzando un orchestrator che supporta i secret, il meccanismo di sovrascrittura funziona anche per i file contenuti in `/run/secrets`: il contenuto del file `/run/secrets/telegram_token`, se presente, prenderà il posto del parametro specificato in uno dei file di configurazione JSON prima elencati.

### Esecuzione

+ Usando Yarn
  ```bash
  yarn start
  ```
+ Usando NPM
  ```bash
  npm start
  ```
+ Usando NodeJS
  ```bash
  node index.js
  ```
+ Usando Docker
  ```bash
  docker run -it --env TELEGRAM_TOKEN=my:token --env TELEGRAM_PASSWORD=foobar --env WEBMAIL_USERNAME=my.username --env WEBMAIL_PASSWORD=hunter2 nmaggioni/unipi-webmail-bot
  ```

### Utilizzo

Inviare il comando `/start myPassword` al bot, usando la password configurata in precedenza. Questo garantisce un livello di privacy minimale.

Il bot risponderà affermativamente o negativamente. In caso affermativo, controllerà una volta all'ora la presenza di nuove email ed invierà un messaggio alla chat da cui il comando `/start` è provenuto.

La stessa meccanica vale per il comando `/stop`, che interrompe il controllo di nuove mail fino al successivo avvio (`/start`) del bot: `/stop myPassword`.
