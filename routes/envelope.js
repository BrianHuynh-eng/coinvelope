const express = require('express');
const toTitleCase = require('../utils/helper-funcs');

const envelopeRouter = express.Router();

const envelopes = []; // Stores envelopes of a category: [{ category: 'Groceries', amount: 100}, { category: 'Gas', amount: 90 }]


envelopeRouter.param('category', (req, res, next, category) => {
    category = toTitleCase(decodeURIComponent(category));
    const envelope = envelopes.find((envelope) => envelope['category'] === category);

    if (envelope) {
        req.envelope = envelope;
        next();
    } else {
        res.status(404).json({ msg: 'Envelope not found' });
    }
});


// Read envelopes
envelopeRouter.get('/all', (req, res) => {
    if (envelopes.length !== 0) {
        res.status(200).json(envelopes);
    } else {
        res.status(404).json({ msg: 'No envelopes found' });
    }
});

envelopeRouter.get('/:category', (req, res) => {
    res.status(200).json(req.envelope);
});


// Create envelopes
envelopeRouter.post('/new', (req, res) => {
    let { category, amount } = req.body;
    category = toTitleCase(category);

    const categoryExists = envelopes.some((envelope) => envelope['category'] === category);
    if (categoryExists) {
        return res.status(400).json({ msg: `"${category}" category already exists` });
    }

    amount = Number(amount);
    if (!category || !amount || amount <= 0) {
        return res.status(400).json({ msg: `Category and amount are required; amount also must be a positive number (creation for "${category}" envelope did not pass)` });
    }

    const newEnvelope = { category, amount };

    envelopes.push(newEnvelope);
    res.status(201).json({ msg: `"${category}" envelope created` });
});


// Update envelopes
envelopeRouter.put('/:category/update', (req, res) => {
    const updatedAmount = Number(req.body.amount);

    if (!updatedAmount || updatedAmount <= 0) {
        return res.status(400).json({ msg: `Amount must be a positive number and greater than 0 ("${req.envelope['category']}" envelope)` });
    }

    req.envelope['amount'] = updatedAmount;
    res.status(200).json({ msg: `"${req.envelope['category']}" envelope's budget updated to $${updatedAmount}` });
});

envelopeRouter.put('/:category/update/subtract', (req, res) => {
    const amount = Number(req.body.amount);

    if ((req.envelope['amount'] - amount) < 0) {
        return res.status(400).json({ msg: `Insufficient funds; You may need to transfer funds from another category to ${req.envelope['category']}` });
    }

    req.envelope['amount'] -= amount;
    res.status(200).json({ msg: `"${req.envelope['category']}" envelope's balance subtracted by $${amount}` });
});

envelopeRouter.put('/transfer', (req, res) => {
    let { categoryFrom, categoryTo, amountToTransfer } = req.body;

    categoryFrom = toTitleCase(categoryFrom);
    categoryTo = toTitleCase(categoryTo);
    amountToTransfer = Number(amountToTransfer);

    const envelopeFrom = envelopes.find((envelope) => envelope['category'] === categoryFrom);
    const envelopeTo = envelopes.find((envelope) => envelope['category'] === categoryTo);

    if (envelopeFrom && envelopeTo) {
        if (envelopeFrom['amount'] >= amountToTransfer) {
            envelopeFrom['amount'] -= amountToTransfer;
            envelopeTo['amount'] += amountToTransfer;
            res.status(200).json({ msg: `$${amountToTransfer} from "${categoryFrom}" envelope transferred to "${categoryTo}" envelope` });

        } else {
            res.status(400).json({ msg: `Insufficient funds for "${categoryFrom}" category` });
        }

    } else {
        if (envelopeFrom && !envelopeTo) {
            res.status(404).json({ msg: `"${categoryTo}" envelope not found. Perhaps you made a typo?` });
        } else {
            res.status(404).json({ msg: `"${categoryFrom}" envelope not found. Perhaps you made a typo?` });
        }
    }
});


// Delete envelopes
envelopeRouter.delete('/:category/delete', (req, res) => {
    const idx = envelopes.findIndex((envelope) => envelope['category'] === req.envelope['category']);
    envelopes.splice(idx, 1);

    res.status(200).json({ msg: `"${req.envelope['category']}" envelope successfully deleted` });
});


module.exports = envelopeRouter;
