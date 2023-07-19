export const isWhiteListed = (whiteList: string[], address: string) => {
  return !(
    whiteList.find((listedAddress) => listedAddress === address) === undefined
  );
};
