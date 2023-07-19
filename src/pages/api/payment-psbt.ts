import axios from "axios";
import { testnet } from "bitcoinjs-lib/src/networks";
import type { NextApiResponse, NextApiRequest } from "next";
import { type WalletTypes } from "~/types/type";
import Bitcoin from "~/utils/bitcoin";
import { getTransferableUtxos } from "~/utils/utxo";

interface ExtendedNextApiRequest extends NextApiRequest {
  body: {
    senderPubkey: string;
    walletType: WalletTypes;
    recipient: string;
    price: number;
  };
}

const handler = async (req: ExtendedNextApiRequest, res: NextApiResponse) => {
  const buyerPubkey = Buffer.from(req.body.senderPubkey, "hex");
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
  } else if (req.body.walletType === "Xverse") {
    const p2wpkh = Bitcoin.payments.p2wpkh({
      pubkey: buyerPubkey,
      network: testnet,
    });
    const { address, redeem } = Bitcoin.payments.p2sh({
      redeem: p2wpkh,
      network: testnet,
    });
    buyerAddress = address;
    buyerOutput = redeem?.output;
  }

  console.log("buyerAddress", buyerAddress);

  const utxos = await getTransferableUtxos(buyerAddress as string, testnet);
  const psbt = new Bitcoin.Psbt({ network: testnet });

  let amount = 0;
  if (req.body.walletType === "Hiro") {
    for (const utxo of utxos) {
      if (amount < req.body.price + 1000) {
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
      if (amount < req.body.price + 1000) {
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
  } else if (req.body.walletType === "Xverse") {
    console.log("utxos", utxos);
    for (const utxo of utxos) {
      if (amount < req.body.price + 1000) {
        amount += utxo.value;
        const { data } = await axios.get(
          `https://mempool.space/testnet/api/tx/${utxo.txid}/hex`
        );
        console.log("utxo.txid", utxo.txid);
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          redeemScript: buyerOutput,
          nonWitnessUtxo: Buffer.from(data, "hex"),
        });
      }
    }
  }

  if (amount < req.body.price + 1000)
    return res.json({ res: false, msg: "You don't have enough bitcoin" });

  psbt.addOutputs([
    {
      value: req.body.price,
      address: req.body.recipient,
    },
    {
      value: amount - req.body.price - 1000,
      address: buyerAddress as string,
    },
  ]);

  if (req.body.walletType === "Xverse")
    return res.send({ res: true, psbt: psbt.toBase64() });

  return res.send({ res: true, psbt: psbt.toHex() });
};

export default handler;
