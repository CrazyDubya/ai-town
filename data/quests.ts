export const Quests = [
  {
    name: 'Follow the White Rabbit',
    description: "You've seen a curious White Rabbit with a pocket watch. You should follow him and see where he's going.",
    assignee: 'Alice',
    completionCondition: 'proximity:White Rabbit:5',
    nextQuestName: "Drink the 'Drink Me' potion",
  },
  {
    name: "Drink the 'Drink Me' potion",
    description: "You've found a small bottle with a label that says 'DRINK ME'. What could it be?",
    assignee: 'Alice',
    completionCondition: 'interact:potion',
    nextQuestName: null,
  },
  {
    name: "Hurry to the Queen's garden",
    description: "You are late for your duties to the Queen! You must hurry to her garden before she gets angry.",
    assignee: 'White Rabbit',
    completionCondition: 'location:10,20',
    nextQuestName: null,
  },
];
