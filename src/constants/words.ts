export const LABLES = require('../../assets/labels.json') as string[];

export const getRandomWord = () => {
  const randomIndex = Math.floor(Math.random() * Object.entries(LABLES).length);
  const word = LABLES[randomIndex];
  // console.log('Available words:', LABLES[0], LABLES[1], LABLES[2], '...');
  // console.log('Selected word:', "" + randomIndex);
  return word;
};