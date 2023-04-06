import express from 'express'
import https from 'https.js'
import Redis from 'ioredis'
import Telnet from "telnet-stream";


// Create a new Redis client instance
const redis = new Redis({
    port: 6379, // default port for Memurai
    host: 'localhost',
    db: 0, // database number to use
});

// Define a function to store the state object in Redis
async function saveState(state) {
    await redis.set('state', JSON.stringify(state));
}

// Define a function to retrieve the state object from Redis
async function loadState() {
    const stateStr = await redis.get('state');
    return stateStr ? JSON.parse(stateStr) : null;
}

// Define a function to update the state object and save it to Redis
async function updateState(newState) {
    const currentState = await loadState() || {};
    const updatedState = { ...currentState, ...newState };
    await saveState(updatedState);
    return updatedState;
}

const denonAppRedis = express();
denonAppRedis.use(express.json());

denonAppRedis.get('/api/state', (req, res) => {
    redis.get('state', (err, state) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal server error');
        } else if (state) {
            res.json(JSON.parse(state));
        } else {
            res.json({});
        }
    });
});

const connection = new Telnet()

connection.on('connect', () => {
    console.log('Telnet connected');

    connection.sendCommand('PW?').then((response) => {
        console.log('Initial power status: ', response);
        const state = {
            power: response.trim() === 'PWON',
            volume: null,
            input: null,
            mute: null,
            surround: null
        };
        redis.set('state', JSON.stringify(state));
    });

    connection.on('data', (data) => {
        console.log('Received data:', data);

        const state = JSON.parse(redis.get('state'));
        const [property, value] = data.trim().split(':');
        switch (property) {
            case 'PW':
                state.power = value === 'ON';
                break;
            case 'MV':
                state.volume = Number(value);
                break;
            case 'SI':
                state.input = value;
                break;
            case 'MU':
                state.mute = value === 'ON';
                break;
            case 'MS':
                state.surround = value;
                break;
        }
        redis.set('state', JSON.stringify(state));
    });
});

connection.connect();

https.createServer(options, denonAppRedis).listen(443, () => {
    console.log('HTTPS server running on port 443');
});

export default denonAppRedis