export const WORD_CATEGORIES = {
  Animals: ['elephant', 'giraffe', 'penguin', 'dolphin', 'kangaroo', 'panda', 'flamingo', 'octopus', 'cheetah', 'koala'],
  Food: ['pizza', 'sushi', 'burger', 'taco', 'ice cream', 'donut', 'avocado', 'watermelon', 'spaghetti', 'cupcake'],
  Objects: ['umbrella', 'telescope', 'backpack', 'lighthouse', 'bicycle', 'compass', 'hourglass', 'lantern', 'mailbox', 'trophy'],
  Nature: ['volcano', 'rainbow', 'snowflake', 'tornado', 'waterfall', 'canyon', 'glacier', 'thunderstorm', 'coral reef', 'aurora'],
  Places: ['castle', 'pyramid', 'igloo', 'treehouse', 'windmill', 'bridge', 'island', 'cave', 'skyscraper', 'cabin'],
  Actions: ['surfing', 'juggling', 'flying', 'diving', 'climbing', 'dancing', 'fishing', 'running', 'swimming', 'painting'],
};

export const ALL_WORDS = Object.values(WORD_CATEGORIES).flat();

export const getRandomWord = () => ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)];

export const getWordHint = (word: string, revealCount: number): string => {
  const chars = word.split('');
  return chars
    .map((char, i) => {
      if (char === ' ') return ' ';
      if (i < revealCount) return char;
      return '_';
    })
    .join(' ');
};
