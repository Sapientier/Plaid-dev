// Using Express
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const keys = require('./config/keys');
const log = console.log;

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded())
app.use(cors({ origin: 'http://localhost:5000' }));
app.set('view engine', 'ejs');

const plaid = require('plaid');

const client = new plaid.Client({
    clientID: keys.CLIENT_ID,
    secret: keys.PLAID_SECRET,
    env: plaid.environments.sandbox,
});

let accessT;

console.log(client)

app.get('/', (req, res) => {
    res.header('Access-Control-Allow-Origin: *');
    res.header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Request-With');
    res.render('pages/index');
})

app.post('/create_link_token', async (req, res) => {
    try {
        const tokenResponse = await client.createLinkToken({
            user: {
                client_user_id: 'test_dev',
            },
            client_name: 'Roger Manzo',
            products: ["transactions", "auth"],
            country_codes: ['US'],
            language: 'es',
            webhook: 'https://postb.in/1630615487525-6100976159796',
        });
        res.json(tokenResponse);
    } catch (e) {
        // Display error on client
        return res.send({ error: e.message });
    }
});

// Exchange token flow - exchange a Link public_token for
// an API access_token
// https://plaid.com/docs/#exchange-token-flow
app.post('/set_access_token', async (req, res) => {
    const publicToken = req.body.public_token;

    try {
        const exchangeTokenResponse = await client.exchangePublicToken(
            publicToken
        );
        const accessToken = exchangeTokenResponse.access_token;
        accessT = accessToken;
        console.log(accessT);
        res.redirect(307, '/item/fire_webhooks/');
    } catch (e) {
        res.json({ error: e });
    }

    /* try {
        const tokenResponse = await client.itemPublicTokenExchange({
            public_token: publicToken,
        });
        //console.log(tokenResponse);
        const accessToken = tokenResponse.data.access_token;
        const itemID = tokenResponse.data.item_id;
        response.json({
            access_token: accessToken,
            item_id: itemID,
            error: null,
        });
    } catch (error) {
        console.log(error.response);
        return response.json(error.response);
    } */
});

/* app.post('/exchange_public_token', async (req, res) => {
    try {
        const exchangeTokenResponse = await client.exchangePublicToken(
            req.body.public_token
        );
        const accessToken = exchangeTokenResponse.access_token;
        accessT = accessToken;
        res.redirect(307, '/item/fire_webhooks/');
    } catch (e) {
        res.json({ error: e });
    }
}); */

app.post('/item/fire_webhooks', async (req, res) => {
    const response = await client.sandboxItemFireWebhook(accessT, 'DEFAULT_UPDATE').catch((err) => {
        res.status(402)
            .json({
                status: 'error',
                message: err
            });
    });
    res.status(202)
        .json({
            status: 'approved',
            data: response
        });
    /* res.redirect('/transactions/get'); */
});


app.get('/transactions/get', async (req, res) => {

    const response = await client
        .getTransactions(accessT, '2020-01-01', '2020-02-01', {})
        .catch((err) => {
            log({ error: err.message });
        });
    const transactions = response.transactions
    const totalTransactions = response.total_transactions;
    res.status(202)
        .json({
            status: 'approved',
            data: transactions,
            total_transactions: totalTransactions
        });
    log(response);
});



app.listen(5000, () => log('server on port 5000'));