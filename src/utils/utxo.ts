import axios, { type AxiosError } from "axios";
import { type Network } from "bitcoinjs-lib";
import { getInscriptions } from "./inscription";

interface IUtxo {
  txid: string;
  vout: number;
  value: number;
}

export const getUtxos = async (address: string): Promise<IUtxo[]> => {
  const url = `https://mempool.space/testnet/api/address/${address}/utxo`;
  const res = await axios.get(url);
  const utxos: IUtxo[] = [];
  res.data.forEach((utxoData: any) => {
    utxos.push({
      txid: utxoData.txid,
      vout: utxoData.vout,
      value: utxoData.value,
    });
  });
  return utxos;
};

export async function pushBTCpmt(rawtx: any) {
  const txid = await postData("https://mempool.space/testnet/api/tx", rawtx);

  return txid;
}

async function postData(
  url: string,
  json: any,
  content_type = "text/plain",
  apikey = ""
): Promise<string | undefined> {
  while (1) {
    try {
      const headers: any = {};
      if (content_type) headers["Content-Type"] = content_type;
      if (apikey) headers["X-Api-Key"] = apikey;
      const res = await axios.post(url, json, {
        headers,
      });

      return res.data as string;
    } catch (err) {
      const axiosErr = err as AxiosError;
      console.log("axiosErr.response?.data", axiosErr.response?.data);
      if (
        !(axiosErr.response?.data as string).includes(
          'sendrawtransaction RPC error: {"code":-26,"message":"too-long-mempool-chain,'
        )
      )
        throw new Error("Got an err when push tx");
    }
  }
}

export const getTransferableUtxos = async (
  address: string,
  network: Network
): Promise<IUtxo[]> => {
  const transferableUtxos: IUtxo[] = [];

  const utxos = await getUtxos(address);
  const inscriptions = await getInscriptions(address, network);

  utxos.forEach((utxo) => {
    const inscriptionUtxo = inscriptions.find((inscription) => {
      return inscription.output.includes(utxo.txid);
    });
    if (!inscriptionUtxo) transferableUtxos.push(utxo);
    else if (utxo.vout !== 0) transferableUtxos.push(utxo);
  });

  return transferableUtxos;
};
