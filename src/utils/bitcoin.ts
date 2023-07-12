import * as Bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";

Bitcoin.initEccLib(ecc);

export default Bitcoin;
