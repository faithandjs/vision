import type { Board } from "./types";

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

/** Shown to signed-out visitors, and as a starting point for new accounts. */
export const sampleBoard: Board = {
  title: "The Year of Becoming",
  theme: "Slower mornings, braver choices, more of what makes me feel alive.",
  data: [
    {
      title: "Find stillness",
      image: { src: unsplash("1506126613408-eca07ce68773"), alt: "Person meditating on a dock at sunset" },
      p: "Ten quiet minutes a day changes everything.",
      check: {
        title: "Rituals",
        list: [
          { value: "Meditate every morning", checked: true },
          { value: "Phone off by 10pm", checked: false },
          { value: "Journal on Sundays", checked: true },
        ],
      },
    },
    {
      title: "Move every day",
      image: { src: unsplash("1476480862126-209bfaa8edc8"), alt: "Runner climbing stone steps" },
      check: {
        title: "I want to",
        list: [
          { value: "Walk 8,000 steps most days", checked: true },
          { value: "Run my first 10k", checked: false },
          { value: "Stretch before bed", checked: false },
        ],
      },
    },
    {
      title: "Read more books",
      image: { src: unsplash("1481627834876-b7833e8f5570"), alt: "Long library aisle lined with books" },
      p: "Fewer screens, more pages.",
      list: { title: "Up next", list: ["Braiding Sweetgrass", "The Overstory", "Pachinko"] },
    },
    {
      title: "See somewhere new",
      image: { src: unsplash("1488646953014-85cb44e25828"), alt: "Map, camera and travel essentials laid out" },
      list: { title: "Places calling me", list: ["Lisbon", "Kyoto", "Cape Town"] },
    },
    {
      title: "Prioritize skincare",
      image: {
        src: "https://i.pinimg.com/originals/59/bf/8d/59bf8d064d6f781c51f5ca2454df9bd5.jpg",
        alt: "Skincare products arranged on a white tray",
      },
      check: {
        title: "I want to",
        list: [
          { value: "Keep a simple daily routine", checked: true },
          { value: "Treat my hyperpigmentation", checked: false },
        ],
      },
    },
    {
      title: "Build my side project",
      image: { src: unsplash("1499951360447-b19be8fe80f5"), alt: "Bright desk with a laptop and monitor" },
      check: {
        title: "Milestones",
        list: [
          { value: "Ship a first version", checked: false },
          { value: "Write about it every week", checked: false },
          { value: "Reach the first 100 users", checked: false },
        ],
      },
    },
    {
      title: "Date myself",
      image: {
        src: "https://i.pinimg.com/originals/44/44/b8/4444b85af5da40955d636b986e6206ac.jpg",
        alt: "Woman in front of a mirror holding a bouquet of flowers",
      },
      p: "I want to treat myself the way I treat the people I love.",
      list: { list: ["Go on dates with myself", "Spend real time alone", "Listen to my body"] },
    },
    {
      title: "Eat well",
      image: { src: unsplash("1512621776951-a57141f2eefd"), alt: "Colorful bowl of vegetables and grains" },
      list: { list: ["Cook at home four nights a week", "More greens, less takeout", "Drink more water"] },
    },
    {
      title: "Climb a mountain",
      image: { src: unsplash("1501555088652-021faa106b9b"), alt: "Hiker with a yellow backpack in a green valley" },
      check: {
        list: [
          { value: "Weekend training hikes", checked: false },
          { value: "Reach a summit", checked: false },
        ],
      },
    },
  ],
};
