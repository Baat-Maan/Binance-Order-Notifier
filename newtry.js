require('dotenv').config();
const request = require('request');
const WebSocket = require('ws');

const API_KEY = { auth: {key: process.env.BINANCE_API_KEY, secret: process.env.BINANCE_SECRET_KEY} }


const DATA_STREAM_ENDPOINT = 'wss://stream.binance.com:9443/ws'
const BINANCE_API_ROOT = 'https://api.binance.com'
const LISTEN_KEY_ENDPOINT = `${BINANCE_API_ROOT}/api/v1/userDataStream`

async function main() { 
  const listenKey = await fetchListenKey()

  console.log('-> ', listenKey) // valid key is returned

  try {
    ws = await openWebSocket(`${DATA_STREAM_ENDPOINT}/${listenKey}`)
  } catch (err) {
    throw(`ERROR - fetchAccountWebsocketData: ${err}`)
  }

  // Nothing returns from either
  ws.on('message', data => console.log(data))
  ws.on('outboundAccountInfo', accountData => console.log(accountData))
}

const openWebSocket = endpoint => {
  const p = new Promise((resolve, reject) => {
    const ws = new WebSocket(endpoint)

    console.log('\n-->> New Account Websocket')

    ws.on('open', () => {
      console.log('\n-->> Websocket Account open...')
      resolve(ws)
    }, err => { 
      console.log('fetchAccountWebsocketData error:', err)
      reject(err) 
    })
  })

  p.catch(err => console.log(`ERROR - fetchAccountWebsocketData: ${err}`))
  return p
}

const fetchListenKey = () => {
  const p = new Promise((resolve, reject) => {
    const options = {
      url: LISTEN_KEY_ENDPOINT, 
      headers: {'X-MBX-APIKEY': API_KEY}
    }

    request.post(options, (err, httpResponse, body) => {
      if (err) 
        return reject(err)

      resolve(JSON.parse(body).listenKey)
    })
  })

  p.catch(err => console.log(`ERROR - fetchListenKey: ${err}`))
  return p
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })