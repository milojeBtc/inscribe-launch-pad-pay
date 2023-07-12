export type WalletTypes = "Xverse" | "Unisat" | "Hiro";

export const Wallets = [
  {
    imgUrl: "/imgs/xverse.png",
    name: "Xverse",
  },
  {
    imgUrl: "/imgs/unisat.png",
    name: "Unisat",
  },
  {
    imgUrl: "/imgs/hiro.png",
    name: "Hiro",
  },
];

declare global {
  interface Window {
    unisat: {
      signPsbt: (psbtHex: string) => Promise<string>;
      getAccounts: () => Promise<[string]>;
      switchNetwork: (network: string) => Promise<void>;
      requestAccounts: () => Promise<string[]>;
      getPublicKey: () => Promise<string>;
      sendBitcoin: (address: string, amount: number) => Promise<string>;
    };
  }
}
