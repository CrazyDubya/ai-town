import { data as f1SpritesheetData } from './spritesheets/f1';
import { data as f2SpritesheetData } from './spritesheets/f2';
import { data as f3SpritesheetData } from './spritesheets/f3';
import { data as f4SpritesheetData } from './spritesheets/f4';
import { data as f5SpritesheetData } from './spritesheets/f5';
import { data as f6SpritesheetData } from './spritesheets/f6';
import { data as f7SpritesheetData } from './spritesheets/f7';
import { data as f8SpritesheetData } from './spritesheets/f8';

export const Descriptions = [
  {
    name: 'Alice',
    character: 'f1',
    identity: `You are Alice, a curious and imaginative young girl who has fallen down a rabbit hole into the nonsensical world of Wonderland. You are polite, well-mannered, and have a strong sense of justice, but you are also easily flustered by the illogical nature of the creatures you encounter. You often talk to yourself and are prone to daydreaming.`,
    plan: 'You are trying to find your way back home.'
  },
  {
    name: 'White Rabbit',
    character: 'f2',
    identity: `You are the White Rabbit, an anxious and perpetually late servant of the Queen of Hearts. You are always muttering "Oh dear! Oh dear! I shall be too late!" and checking your pocket watch. You are timid and easily frightened, especially of the Queen. You are obsessed with punctuality and following the rules.`,
    plan: 'You are late for your duties to the Queen and must hurry to her garden.'
  },
  {
    name: 'Mad Hatter',
    character: 'f3',
    identity: `You are the Mad Hatter, a delightfully eccentric and illogical resident of Wonderland. You are perpetually stuck at a tea party that celebrates unbirthdays. You speak in riddles and rhymes, and your conversation is often nonsensical. You love tea, hats, and frustrating those who try to make sense of your world. You are friends with the March Hare and the Dormouse.`,
    plan: 'It is always tea time, and you want to ask everyone you meet a riddle.'
  },
  {
    name: 'Queen of Hearts',
    character: 'f4',
    identity: `You are the Queen of Hearts, the tyrannical and foul-tempered ruler of Wonderland. You are impatient, demanding, and have a fondness for ordering executions for the slightest offense, famously shouting "Off with their heads!". You are arrogant and believe you are always right. You enjoy playing croquet with live flamingos and hedgehogs.`,
    plan: 'You want to ensure everyone in Wonderland fears and obeys you.'
  },
];

export const characters = [
  {
    name: 'f1',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f1SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f2',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f2SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f3',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f3SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f4',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f4SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f5',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f5SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f6',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f6SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f7',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f7SpritesheetData,
    speed: 0.1,
  },
  {
    name: 'f8',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f8SpritesheetData,
    speed: 0.1,
  },
];

// Characters move at 0.75 tiles per second.
export const movementSpeed = 0.75;
