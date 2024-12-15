const express = require('express');
const toTitleCase = require('../utils/helper-funcs');

const envelopeRouter = express.Router();

const envelopes = []; // Stores envelopes of a category: [{ category: 'Groceries', amount: 100}, { category: 'Gas', amount: 90 }]
let budgetingPower = 0;


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


// Read all envelopes
envelopeRouter.get('/all', (req, res) => {
    if (envelopes.length !== 0) {
        res.status(200).json({ envelopes });
    } else {
        res.status(404).json({ msg: 'No envelopes found' });
    }
});


// Read budgeting information
envelopeRouter.get('/budgeting-power', (req, res) => {
    res.status(200).json({ budgetingPower });
});


envelopeRouter.get('/total-balance', (req, res) => {
    if (envelopes.length === 0) {
        return res.status(200).json({ totalBalance: 0 });
    }

    const totalBalance = envelopes.reduce((acc, envelope) => acc + envelope['amount'], 0);
    res.status(200).json({ totalBalance });
});


// Create new envelope
envelopeRouter.post('/new', (req, res) => {
    let { category, amount } = req.body;
    category = toTitleCase(category);

    const categoryExists = envelopes.some((envelope) => envelope['category'] === category);
    if (categoryExists) {
        return res.status(400).json({ msg: `"${category}" category already exists` });
    }

    amount = Number(amount);
    if (!category || !amount || amount < 0) {
        return res.status(400).json({ msg: `Category and amount are required; amount also must be a positive number (creation for "${category}" envelope did not pass)` });
    }

    if (budgetingPower < amount) {
        return res.status(400).json({ msg: `"${category}" envelope cannot be created because its budget amount exceeds the $${budgetingPower} Budgeting Power you have left; either lower the budget amount (if possible and recommended) OR recreate this envelope with a budget amount of $0 and then transfer money from one envelope to this envelope (not recommended)` });
    }

    budgetingPower -= amount;
    const newEnvelope = { category, amount };
    envelopes.push(newEnvelope);

    res.status(201).json({ msg: `"${category}" envelope created` });
});


// Input monthly income
envelopeRouter.post('/income', (req, res) => {
    const { monthlyIncome } = req.body;

    if (!monthlyIncome || monthlyIncome < 0) {
        return res.status(400).json({ msg: 'Income is required and must be a positive number' });
    }

    budgetingPower = monthlyIncome;
    res.status(201).json({ msg: `Monthly income input successful ($${budgetingPower}/month)` });
});


// Transfer money between envelopes
envelopeRouter.put('/transfer', (req, res) => {
    let { categoryFrom, categoryTo, transferAmount } = req.body;

    categoryFrom = toTitleCase(categoryFrom);
    categoryTo = toTitleCase(categoryTo);
    transferAmount = Number(transferAmount);

    const envelopeFrom = envelopes.find((envelope) => envelope['category'] === categoryFrom);
    const envelopeTo = envelopes.find((envelope) => envelope['category'] === categoryTo);

    if (envelopeFrom && envelopeTo) {
        if (envelopeFrom['amount'] >= transferAmount) {
            envelopeFrom['amount'] -= transferAmount;
            envelopeTo['amount'] += transferAmount;
            res.status(200).json({ msg: `$${transferAmount} from "${categoryFrom}" envelope transferred to "${categoryTo}" envelope` });

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


// Read single envelope
envelopeRouter.get('/:category', (req, res) => {
    res.status(200).json({ envelope: req.envelope });
});


// Update budget amount for single envelope
envelopeRouter.put('/:category/update', (req, res) => {
    const updatedAmount = Number(req.body.amount);

    if (!updatedAmount || updatedAmount <= 0) {
        return res.status(400).json({ msg: `Amount must be a positive number and greater than 0 ("${req.envelope['category']}" envelope)` });
    }

    const budgetingPowerSubtracted = updatedAmount - req.envelope['amount'];

    if ((budgetingPower - budgetingPowerSubtracted) < 0) {
        return res.status(400).json({ msg: `"${req.envelope['category']}" envelope cannot be updated because its budget amount exceeds the $${budgetingPower} Budgeting Power you have left; either keep the budget amount the same (if possible and recommended) OR transfer money from one envelope to this envelope (not recommended)` });
    }

    budgetingPower -= budgetingPowerSubtracted;
    req.envelope['amount'] = updatedAmount;

    res.status(200).json({ msg: `"${req.envelope['category']}" envelope's budget updated to $${updatedAmount}` });
});


// Subtract budget amount for single envelope
envelopeRouter.put('/:category/update/subtract', (req, res) => {
    const subtractAmount = Number(req.body.subtractAmount);

    if ((req.envelope['amount'] - subtractAmount) < 0) {
        return res.status(400).json({ msg: `Insufficient funds; You may need to transfer funds from another category to ${req.envelope['category']}` });
    }

    req.envelope['amount'] -= subtractAmount;
    res.status(200).json({ msg: `"${req.envelope['category']}" envelope's balance subtracted by $${subtractAmount}` });
});


// Delete single envelope
envelopeRouter.delete('/:category/delete', (req, res) => {
    const idx = envelopes.findIndex((envelope) => envelope['category'] === req.envelope['category']);
    budgetingPower += req.envelope['amount'];
    envelopes.splice(idx, 1);

    res.status(200).json({ msg: `"${req.envelope['category']}" envelope successfully deleted` });
});


module.exports = envelopeRouter;
