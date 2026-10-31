export const TYPE_COLORS = {
  1: "#e6194b", 2: "#3cb44b", 3: "#4363d8", 4: "#f58231",
  5: "#911eb4", 6: "#42d4f4", 7: "#f032e6", 8: "#bfef45",
  9: "#469990", 10: "#dcbeff", 11: "#9a6324", 12: "#800000",
  13: "#aaffc3", 14: "#808000", 15: "#000075", 16: "#e6beff",
  17: "#555555", 18: "#ffffff",
};

export const typeColor = (typeId) => TYPE_COLORS[typeId] || "#1f4e3d";

export const pointColor = (feature) => typeColor(feature?.properties?.type?.id);

// Types de points connus de l'API (cf. doc /api et code source refuges.info)
export const TYPE_LABELS = {
  3: "point de passage délicat",
  7: "cabane non gardée",
  9: "gîte d'étape",
  10: "refuge gardé",
  23: "point d'eau",
  28: "bâtiment à explorer",
  29: "abri naturel / grotte",
};
