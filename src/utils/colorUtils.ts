export const generateColorFromString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // High saturation (70-90%) and lightness (50-60%) for vibrant but readable colors on dark bg
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 80%, 60%)`;
};
