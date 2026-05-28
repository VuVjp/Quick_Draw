const rawLabels = require('../../assets/labels.json') as Record<string, string>;

export const LABLES = Object.values(rawLabels);

export const getRandomWord = () => {
  const randomIndex = Math.floor(Math.random() * LABLES.length);
  const word = LABLES[randomIndex];
  // console.log('Available words:', LABLES[0], LABLES[1], LABLES[2], '...');
  // console.log('Selected word:', "" + randomIndex);
  return word;
};