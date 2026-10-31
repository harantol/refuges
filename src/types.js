export const TYPE_COLORS = {
  1: "#e6194b", 2: "#3cb44b", 3: "#4363d8", 4: "#f58231",
  5: "#911eb4", 6: "#42d4f4", 7: "#f032e6", 8: "#bfef45",
  9: "#469990", 10: "#dcbeff", 11: "#9a6324", 12: "#800000",
  13: "#aaffc3", 14: "#808000", 15: "#000075", 16: "#e6beff",
  17: "#555555", 18: "#ffffff",
};

export const typeColor = (typeId) => TYPE_COLORS[typeId] || "#1f4e3d";

export const pointColor = (feature) => typeColor(feature?.properties?.type?.id);
