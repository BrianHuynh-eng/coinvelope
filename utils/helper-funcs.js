const toTitleCase = (str) => {
    return str.toLowerCase().replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
};

module.exports = toTitleCase
