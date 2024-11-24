const express = require('express');
const envelopeRouter = express.Router();

const envelopes = []; // Stores envelopes of a category: [{ category: 'Groceries', amount: 100}, { category: 'Gas', amount: 90 }]


envelopeRouter.param('category', (req, res, next, id) => {
    const envelope = envelopes.find((envelope) => envelope['category'] === id);

    if (envelope) {
        req.envelope = envelope;
        next();
    } else {
        res.status(404).json({error: 'Envelope not found'});
    }
});


// Read envelopes
envelopeRouter.get('', (req, res) => {
    if (envelopes.length !== 0) {
        res.status(200).json(envelopes);
    } else {
        res.status(404).json({error: 'No envelopes found'});
    }
});

envelopeRouter.get('/:category', (req, res) => {
    res.status(200).json(req.envelope);
});


// Create envelopes
envelopeRouter.post('/new', (req, res) => {
    let { category, amount } = req.body;

    const categoryExists = envelopes.some((envelope) => envelope['category'] === category);
    if (categoryExists) {
        return res.status(400).json({error: 'Category already exists'});
    }

    amount = Number(amount);
    if (!category || !amount || amount <= 0) {
        return res.status(400).json({error: 'Category and amount are required; amount also must be a positive number'});
    }

    const newEnvelope = {category, amount};

    envelopes.push(newEnvelope);
    res.status(201).json(newEnvelope);
});


// Update envelopes
envelopeRouter.put('/:category/update', (req, res) => {
    const updatedAmount = Number(req.body.amount);

    if (!updatedAmount || updatedAmount <= 0) {
        return res.status(400).json({error: 'Amount must be a positive number and more than 0'});
    }

    req.envelope['amount'] = updatedAmount;
    res.status(200).json(req.envelope);
});

envelopeRouter.put('/:category/subtract', (req, res) => {
    if ((req.envelope['amount'] - Number(req.body.amount)) < 0) {
        return res.status(400).json({error: 'Insufficient funds; You may need to transfer funds from another category to this category'});
    }

    req.envelope['amount'] -= Number(req.body.amount);
    res.status(200).json(req.envelope);
});

envelopeRouter.put('/transfer', (req, res) => {
    let { from, to, amount } = req.body;
    amount = Number(amount);

    const categoryFrom = envelopes.find((envelope) => envelope['category'] === from);
    const categoryTo = envelopes.find((envelope) => envelope['category'] === to);

    if (categoryFrom && categoryTo) {
        if (categoryFrom['amount'] >= amount) {
            categoryFrom['amount'] -= amount;
            categoryTo['amount'] += amount;
            res.status(200).json({from: categoryFrom, to: categoryTo});
        } else {
            res.status(400).json({error: `Insufficient funds in '${from}' category`});
        }
    } else {
        res.status(404).json({error: 'Envelope(s) not found'});
    }
});


// Delete envelopes
envelopeRouter.delete('/:category/delete', (req, res) => {
    envelopes.splice(envelopes.indexOf(req.envelope), 1);
    res.status(200).json({message: 'Envelope deleted'});
});


module.exports = envelopeRouter;
