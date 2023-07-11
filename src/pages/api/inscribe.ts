import type { NextApiRequest, NextApiResponse } from "next";
import { pushBTCpmt, sendBtcs } from "~/utils/utxo";
import { type PublicKey, type SecretKey } from "@cmdcode/crypto-utils";
import { Address, Signer, Tap, Tx, type TxData } from "@cmdcode/tapscript";
import { Buff } from "@cmdcode/buff-utils";
import * as fs from "fs";
import config from "~/config";
import MockWallet from "~/utils/mock-wallet";

const mockWallet = new MockWallet();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const inscriptionId = await inscribe();
  res.send({ id: inscriptionId });
};

export default handler;

const getInscriptionFee = () => {
  const imgdata = fs.readFileSync("./generated/svg/1.svg");
  const marker = Buff.encode("ord");
  const mimetype = Buff.encode("image/svg+xml");

  const script = [
    mockWallet.pubkey,
    "OP_CHECKSIG",
    "OP_0",
    "OP_IF",
    marker,
    "01",
    mimetype,
    "OP_0",
    imgdata,
    "OP_ENDIF",
  ];
  const tapleaf = Tap.encodeScript(script as any[]);
  const fee = (tapleaf.length / 4 + config.defaultOutput) * config.txRate;
  return fee;
};

const inscribeInscription = async (i: number) => {
  const imgdata = fs.readFileSync(`./generated/svg/${i}.svg`);
  const marker = Buff.encode("ord");
  const mimetype = Buff.encode("image/svg+xml");

  const script = [
    mockWallet.pubkey,
    "OP_CHECKSIG",
    "OP_0",
    "OP_IF",
    marker,
    "01",
    mimetype,
    "OP_0",
    imgdata,
    "OP_ENDIF",
  ];
  const tapleaf = Tap.encodeScript(script as any[]);
  const [tpubkey, cblock] = Tap.getPubKey(mockWallet.pubkey as PublicKey, {
    target: tapleaf,
  });
  const address = Address.p2tr.fromPubKey(tpubkey, "testnet");
  const fee = (imgdata.length / 4 + config.defaultOutput) * config.txRate;
  const txId = await sendBtcs(mockWallet, address, fee);

  const txdata = Tx.create({
    vin: [
      {
        txid: txId,
        vout: 0,
        prevout: {
          value: fee,
          scriptPubKey: ["OP_1", tpubkey],
        },
      },
    ],
    vout: [
      {
        value: 546,
        scriptPubKey: Address.toScriptPubKey(config.recipient),
      },
    ],
  });

  const sig = Signer.taproot.sign(mockWallet.seckey as SecretKey, txdata, 0, {
    extension: tapleaf,
  });
  txdata.vin[0].witness = [sig, script as any[], cblock];

  const rawTx = Tx.encode(txdata).hex;
  const tx = await pushBTCpmt(rawTx);
  console.log("inscription id", `${tx as string}i0`);
  return `${tx as string}i0`;
};

const inscribe = async () => {
  mockWallet.init();
  console.log("funding address", mockWallet.fundingAddress);
  const inscriptionFee = getInscriptionFee();
  const estimatedFee = (inscriptionFee + 300) * config.amount;
  console.log("estimatedFee", estimatedFee);
  const inscriptionId = await inscribeInscription(1);
  // fs.writeFileSync(`./res.json`, JSON.stringify(data, null, " "));
  return inscriptionId;
};
