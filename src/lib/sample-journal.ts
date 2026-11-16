import { sortEntries } from "./board";
import type { Journal } from "./types";

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

/** Shown to signed-out visitors, and as a starting point for new accounts. */
export const sampleJournal: Journal = {
  entries: sortEntries([
    {
      id: "sample-five-year",
      date: "2026-01-04",
      title: "Five-year plan",
      image: { src: unsplash("1501555088652-021faa106b9b"), alt: "Hiker looking out over a green mountain valley" },
      p: "Where I want to be by 2031, and the small steps that get me there.",
      list: {
        title: "By 2031",
        list: ["A home with room for a garden", "Conversational Spanish", "A small studio of my own", "Six weeks of travel a year"],
      },
      check: {
        title: "This year",
        list: [
          { value: "Open a dedicated savings account", checked: true },
          { value: "Take an evening Spanish class", checked: false },
          { value: "Take on two freelance projects", checked: false },
        ],
      },
    },
    {
      id: "sample-career",
      date: "2026-02-11",
      title: "Career plan",
      image: { src: unsplash("1499951360447-b19be8fe80f5"), alt: "Bright desk with a laptop and monitor" },
      p: "Grow from doing the work to shaping it.",
      list: { title: "Skills to build", list: ["Leading a team", "Public speaking", "Product strategy"] },
      check: {
        title: "Milestones",
        list: [
          { value: "Ask for a mentor", checked: true },
          { value: "Lead one project end to end", checked: false },
          { value: "Give a talk at a meetup", checked: false },
        ],
      },
    },
    {
      id: "sample-good-day",
      date: "2026-03-22",
      // A writing prompt: no image needed.
      title: "What does a good day look like in five years?",
      image: { src: "", alt: "" },
      p: "Slow coffee before anyone needs me. Meaningful work until early afternoon, then a walk with nowhere to be. Friends at the table most weekends.",
      list: {
        title: "Notice",
        list: ["Where I am", "Who I'm with", "What I'm no longer doing"],
      },
      check: {
        list: [
          { value: "Write my answer by hand", checked: false },
          { value: "Reread it every New Year", checked: false },
        ],
      },
    },
    {
      id: "sample-learning",
      date: "2025-12-30",
      title: "Learning plan",
      image: { src: unsplash("1481627834876-b7833e8f5570"), alt: "Long library aisle lined with books" },
      p: "One deep subject a year, studied properly.",
      check: {
        list: [
          { value: "Finish an online design course", checked: false },
          { value: "Read one book a month", checked: true },
        ],
      },
    },
  ]),
};
