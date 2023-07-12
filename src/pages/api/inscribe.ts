import type { NextApiRequest, NextApiResponse } from "next";
import config from "~/config";
import MockWallet from "~/utils/mock-wallet";
import { type IInscription, getInscriptions } from "~/utils/inscription";
import { testnet } from "bitcoinjs-lib/src/networks";
import adminWallet from "~/utils/admin-wallet";
import { getTransferableUtxos } from "~/utils/utxo";
import Bitcoin from "~/utils/bitcoin";

const mockWallet = new MockWallet();
mockWallet.init();

interface ExtendedNextApiRequest extends NextApiRequest {
  body: {
    recipient: string;
    buyerPubkey: string;
  };
}

const handler = async (req: ExtendedNextApiRequest, res: NextApiResponse) => {
  const inscriptionUtxos = await getInscriptions(adminWallet.address, testnet);
  const inscriptionUtxo = inscriptionUtxos[0] as IInscription;

  const [inscriptionHash, inscriptionIndex] = inscriptionUtxo.output.split(
    ":"
  ) as [string, string];
  const inscriptionOwnerPubkey = Buffer.from(adminWallet.publicKey, "hex");

  const buyerPubkey = Buffer.from(req.body.buyerPubkey, "hex");
  const { address: buyerAddress, output: buyerOutput } = Bitcoin.payments.p2tr({
    internalPubkey: buyerPubkey.slice(1, 33),
    network: testnet,
  });
  const utxos = await getTransferableUtxos(buyerAddress as string, testnet);

  const psbt = new Bitcoin.Psbt({ network: testnet });
  psbt.addInputs([
    {
      hash: inscriptionHash,
      index: Number(inscriptionIndex),
      witnessUtxo: {
        value: inscriptionUtxo.outputValue,
        script: adminWallet.output,
      },
      tapInternalKey: inscriptionOwnerPubkey.slice(1, 33),
    },
  ]);

  let amount = 0;
  for (const utxo of utxos) {
    if (amount < config.price + 1000) {
      amount += utxo.value;
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          value: utxo.value,
          script: buyerOutput as Buffer,
        },
        tapInternalKey: buyerPubkey.slice(1, 33),
      });
    }
  }

  if (amount < config.price + 1000)
    return res.json({ res: false, msg: "You don't have enough bitcoin" });

  psbt.addOutputs([
    {
      value: inscriptionUtxo.outputValue,
      address: req.body.recipient,
    },
    {
      value: config.price,
      address: adminWallet.address,
    },
    {
      value: amount - config.price - 1000,
      address: buyerAddress as string,
    },
  ]);

  res.send({ res: true, psbt: psbt.toHex() });
};

export default handler;
