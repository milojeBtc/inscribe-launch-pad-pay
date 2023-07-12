import axios from "axios";
import { type NextApiResponse, type NextApiRequest } from "next";
import adminWallet from "~/utils/admin-wallet";
import Bitcoin from "~/utils/bitcoin";
import prisma from "~/utils/prisma";

interface ExtendedNextApiRequest extends NextApiRequest {
  body: {
    signedPsbt: string;
    psbt: string;
  };
}

const handler = async (req: ExtendedNextApiRequest, res: NextApiResponse) => {
  const psbt = Bitcoin.Psbt.fromHex(req.body.psbt);
  const signedPsbt1 = Bitcoin.Psbt.fromHex(req.body.signedPsbt);
  const signedPsbt2 = adminWallet.signPsbt(psbt);
  psbt.combine(signedPsbt1, signedPsbt2);
  const tx = psbt.extractTransaction();
  const txHex = tx.toHex();
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
