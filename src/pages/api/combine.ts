import axios from "axios";
import { type NextApiResponse, type NextApiRequest } from "next";
import adminWallet from "~/utils/admin-wallet";
import Bitcoin from "~/utils/bitcoin";
import prisma from "~/utils/prisma";

interface ExtendedNextApiRequest extends NextApiRequest {
  body: {
    signedPsbt: string;
    psbt: string;
    walletType: string;
  };
}

const handler = async (req: ExtendedNextApiRequest, res: NextApiResponse) => {
  let txHex, psbt;
  if (req.body.walletType === "Xverse") {
    psbt = Bitcoin.Psbt.fromBase64(req.body.psbt);
    const signedPsbt1 = Bitcoin.Psbt.fromBase64(req.body.signedPsbt);
    signedPsbt1.finalizeInput(1);
    const signedPsbt2 = adminWallet.signPsbt(psbt);
    psbt.combine(signedPsbt1, signedPsbt2);
    const tx = psbt.extractTransaction();
    txHex = tx.toHex();
  } else {
    psbt = Bitcoin.Psbt.fromHex(req.body.psbt);
    const signedPsbt1 = Bitcoin.Psbt.fromHex(req.body.signedPsbt);
    const signedPsbt2 = adminWallet.signPsbt(psbt);
    if (req.body.walletType === "Hiro") signedPsbt1.finalizeInput(1);
    psbt.combine(signedPsbt1, signedPsbt2);
    const tx = psbt.extractTransaction();
    txHex = tx.toHex();
  }
  const pushTransaction = await axios.post(
    "https://mempool.space/testnet/api/tx",
    txHex
  );

  if (pushTransaction.data) {
    await prisma.inscriptions.update({
      where: {
        inscriptionId: `${
          psbt.txInputs[0]?.hash.reverse().toString("hex") as string
        }i0`,
      },
      data: { isSold: true },
    });
    return res.status(200).send({ tx: pushTransaction.data, res: true });
  }
  return res.json({ res: false, msg: "Failed to push transaction" });
};

export default handler;
