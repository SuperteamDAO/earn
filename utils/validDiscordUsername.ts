export const isValidDiscordUsername = (username: string) => {
  if (username?.length === 0) {
    return false;
  }
  const pattern = /^((.+?)#\d{4})/;
  return !!pattern.test(username);
};
