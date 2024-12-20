const express = require('express');
const updatesRouter = express.Router();

let updatesHistory = []; // Stores update messages: ['${category} envelope created', 'Transfer amount: ___ From envelope: ___ To envelope: ___', '${category} envelope subtracted by ___']


updatesRouter.get('/all', (req, res) => {
    if (updatesHistory.length !== 0) {
        res.status(200).json({ updatesHistory });
    } else {
        res.status(404).json({msg: 'No updates yet!'});
    }
});

updatesRouter.post('/new', (req, res) => {
    const { msg } = req.body;

    updatesHistory.push(msg);
    if (updatesHistory.length > 30) {
        updatesHistory.shift();
    }
    
    res.status(201).send();
});

updatesRouter.delete('/delete-all', (req, res) => {
    updatesHistory = [];
    res.status(200).send();
});

module.exports = updatesRouter;
