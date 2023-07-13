import type { NextApiRequest, NextApiResponse } from "next";
import config from "~/config";
import MockWallet from "~/utils/mock-wallet";
import { type IInscription } from "~/utils/inscription";
import { testnet } from "bitcoinjs-lib/src/networks";
import adminWallet from "~/utils/admin-wallet";
import { getTransferableUtxos } from "~/utils/utxo";
import Bitcoin from "~/utils/bitcoin";
import prisma from "~/utils/prisma";
import { inscribe } from "~/utils/inscribe";

const mockWallet = new MockWallet();
mockWallet.init();

interface ExtendedNextApiRequest extends NextApiRequest {
  body: {
    recipient: string;
    buyerPubkey: string;
    walletType: string;
  };
}

const handler = async (req: ExtendedNextApiRequest, res: NextApiResponse) => {
  const inscription = await prisma.inscriptions.findFirst({
    where: {
      isSold: false,
    },
  });

  let inscriptionUtxo: IInscription;
  if (inscription) {
    const [tx] = inscription.inscriptionId.split("i");
    inscriptionUtxo = {
      address: adminWallet.address,
      inscriptionId: `${tx as string}i0`,
      inscriptionNumber: 0,
      output: `${tx as string}:${0}`,
      outputValue: 546,
    };
  } else {
    const tx = await inscribe();
    if (!tx) return res.json({ res: false, msg: "Failed to inscribe" });
    await prisma.inscriptions.create({
      data: {
        inscriptionId: `${tx}i0`,
      },
    });
    inscriptionUtxo = {
      address: adminWallet.address,
      inscriptionId: `${tx}i0`,
      inscriptionNumber: 0,
      output: `${tx}:${0}`,
      outputValue: 546,
    };
  }

  const [inscriptionHash, inscriptionIndex] = inscriptionUtxo.output.split(
    ":"
  ) as [string, string];
  const inscriptionOwnerPubkey = Buffer.from(adminWallet.publicKey, "hex");

  const buyerPubkey = Buffer.from(req.body.buyerPubkey, "hex");

  let buyerAddress, buyerOutput;
  if (req.body.walletType === "Hiro") {
    const { address, output } = Bitcoin.payments.p2wpkh({
      pubkey: buyerPubkey,
      network: testnet,
    });
    buyerAddress = address;
    buyerOutput = output;
  } else if (req.body.walletType === "Unisat") {
    const { address, output } = Bitcoin.payments.p2tr({
      internalPubkey: buyerPubkey.slice(1, 33),
      network: testnet,
    });
    buyerAddress = address;
    buyerOutput = output;
  }

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
  if (req.body.walletType === "Hiro") {
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
        });
      }
    }
  } else if (req.body.walletType === "Unisat") {
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
