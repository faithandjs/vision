import type { Board } from "./types";

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

/** Shown to signed-out visitors, and as a starting point for new accounts. Kept to four cards. */
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
  ],
};
