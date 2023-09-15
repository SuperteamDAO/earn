export const createMessage = (hash: string) => {
  try {
    const message = hash; // @todo - add a message

    const data = new TextEncoder().encode(message);
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
