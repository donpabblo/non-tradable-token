const express = require('express');
const router = express.Router();
require('dotenv').config();
const session = require('express-session');
const { NETWORK_ID, NETWORK, CONTRACT, INFURA_KEY, SESSION_SECRET, PRIVATE_KEY, PROVIDER } = process.env;
const { ethers } = require('ethers');
const NTT = require('../artifacts/contracts/NTT.sol/NTT.json');

router.use(session({ secret: SESSION_SECRET, resave: true, saveUninitialized: true, cookie: { maxAge: 6000000 } }))

function getProvider() {
    if (NETWORK == 'localhost') {
        return ethers.getDefaultProvider('http://localhost:8545');
    } else {
        return new ethers.providers.InfuraProvider(NETWORK, INFURA_KEY);
    }
}

router.get('/ping', async function (req, res) {
    res.json({ result: "pong" });
});

router.get('/env', async function (req, res) {
    res.json({
        name: NETWORK,
        network_id: NETWORK_ID,
        network_id_hex: '0x' + parseInt(NETWORK_ID).toString(16),
        rpcUrls: [PROVIDER],
        nativeCurrency: {
            name: "ETH",
            symbol: "ETH",
            decimals: 18,
        },
    });
});

router.get('/stats/owner/:address', async function (req, res) {
    try {
        let provider = getProvider();
        let contract = new ethers.Contract(CONTRACT, NTT.abi, provider);
        const balanceOf = await contract.balanceOf(req.params.address);
        const hasValid = await contract.hasValid(req.params.address);
        res.json({ balance: balanceOf.toNumber(), valid: hasValid });
    } catch (err) {
        res.json({ error: err }).status(500);
    }
});

router.get('/stats/contract', async function (req, res) {
    try {
        let provider = getProvider();
        let contract = new ethers.Contract(CONTRACT, NTT.abi, provider);
        const emittedCount = await contract.emittedCount();
        const holdersCount = await contract.holdersCount();
        res.json({ holders: holdersCount.toNumber(), emitted: emittedCount.toNumber() });
    } catch (err) {
        res.json({ error: err }).status(500);
    }
});

router.post('/mint', async function (req, res) {
    try {
        let candidateAddress = req.body.address;
        let signature = req.body.signature;
        const verifiedAddress = await ethers.utils.verifyMessage(candidateAddress, signature);
        if (verifiedAddress == candidateAddress) {
            var provider = getProvider();
            var wallet = new ethers.Wallet(PRIVATE_KEY, provider);
            const contract = new ethers.Contract(CONTRACT, NTT.abi, wallet)
            const balanceOf = await contract.balanceOf(verifiedAddress);
            if (balanceOf == 0) {
                let transaction = await contract.mint(verifiedAddress, {
                    gasLimit: 500_000,
                });
                let trans = await transaction.wait();
                res.json({
                    fee: parseInt(trans.gasUsed._hex, 16)
                });
            } else {
                res.json({ error: "You already have an NTT" }).status(500);
            }
        } else {
            res.json({ error: "Signature doesn't match address" }).status(500);
        }
    } catch (err) {
        res.json({ error: err }).status(500);
    }
});

module.exports = router;
