const express = require('express');
const updatePoolRouter = express.Router();

const updatePool = []; // Stores update messages: ['${category} envelope created', 'Transfer amount: ___ From envelope: ___ To envelope: ___', '${category} envelope subtracted by ___']


updatePoolRouter.get('/all', (req, res) => {
    if (updatePool.length !== 0) {
        res.status(200).json(updatePool);
    } else {
        res.status(404).json({error: 'No updates found yet! Start budgeting now and create some envelopes!'});
    }
});

updatePoolRouter.post('/new', (req, res) => {
    const { msg } = req.body;
    updatePool.push(msg);
    
    res.status(201).send();
});

module.exports = updatePoolRouter;
