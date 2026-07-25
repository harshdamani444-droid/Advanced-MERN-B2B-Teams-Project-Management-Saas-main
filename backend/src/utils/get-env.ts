export const getEnv = (key: string, defaultValue: string = ""): string => {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    return defaultValue;
  }
  return value;
};
