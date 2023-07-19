import { type BtcAddress } from "@btckit/types";
import axios from "axios";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AddressPurposes, getAddress, signTransaction } from "sats-connect";
import Footer from "~/components/layout/Footer";
import Header from "~/components/layout/Header";
import WalletConnectModal from "~/components/wallet-connect/WalletConnectModal";
import {
  selectIsAuthenticated,
  selectWalletName,
} from "~/components/wallet-connect/walletConnectSlice";
import { TotalAmount, WhiteList } from "~/config";
import { isWhiteListed } from "~/utils/whitelist";

const adminAddress: string = process.env
  .NEXT_PUBLIC_ADMIN_WALLET_ADDRESS as string;
const price = 30000;
const apiUrl = process.env.NEXT_PUBLIC_API_URL as string;
const createPsbtApi = process.env.NEXT_PUBLIC_CREATE_PSBT_API as string;

export default function Home() {
  const [walletConnectModalVisible, setWalletConnectModalVisible] =
    useState(false);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const walletName = useSelector(selectWalletName);
  const [isLoading, setIsloading] = useState(false);
  const [mintedCount, setMintedCount] = useState(0);
  const [publicMintTime, setPublicMintTime] = useState(0);
  const [ogMintTime, setOgMintTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const currentTimeString = new Date().toUTCString();
    const currentTime = Date.parse(currentTimeString);
    const oGMintTIme = Date.parse("19 Jul 2023 20:00:00 GMT");
    const publicMintTime = Date.parse("19 Jul 2023 21:00:00 GMT");
    setCurrentTime(currentTime);
    setOgMintTime(oGMintTIme);
    setPublicMintTime(publicMintTime);
  }, []);

  useEffect(() => {
    if (currentTime)
      setTimeout(() => {
        const currentTimeString = new Date().toUTCString();
        const currentTime = Date.parse(currentTimeString);
        setCurrentTime(currentTime);
      }, 1000);
  }, [currentTime]);

  useEffect(() => {
    setInterval(() => {
      void (async () => {
        try {
          const res = await axios.get(
            process.env.NEXT_PUBLIC_CREATE_TOTAL_COUNT_API as string
          );
          setMintedCount(res.data.count);
        } catch (error) {
          console.error(error);
        }
      })();
    }, 500);
  }, []);

  const onMintBtnClicked = async () => {
    if (!isAuthenticated) return setWalletConnectModalVisible(true);
    if (walletName === "Unisat") {
      try {
        setIsloading(true);
        const pubkey = await window.unisat.getPublicKey();
        const [address] = await window.unisat.getAccounts();
        if (
          !(
            currentTime < ogMintTime + 1000 * 3600 &&
            isWhiteListed(WhiteList, address)
          )
        ) {
          setIsloading(false);
          return alert("You are not whitelisted");
        }
        const res = await axios.post(createPsbtApi, {
          senderPubkey: pubkey,
          walletType: "Unisat",
          recipient: adminAddress,
          price,
        });
        const signedPsbt = await window.unisat.signPsbt(res.data.psbt);
        const sendPsbt = await axios.post(apiUrl, {
          psbtHex: signedPsbt,
          walletType: "Unisat",
          ordinalsWallet: address,
        });
        alert("success");
        setIsloading(false);
      } catch (error) {
        console.error(error);
        alert("failed 1");
        setIsloading(false);
      }
    } else if (walletName === "Hiro") {
      try {
        setIsloading(true);
        const addressesRes = await window.btc?.request("getAddresses");
        const { address } = (addressesRes as any).result.addresses.find(
          (address: BtcAddress) => address.type === "p2tr"
        );
        if (
          !(
            currentTime < ogMintTime + 1000 * 3600 &&
            isWhiteListed(WhiteList, address)
          )
        ) {
          setIsloading(false);
          return alert("You are not whitelisted");
        }
        const pubkey = (addressesRes as any).result.addresses.find(
          (address: BtcAddress) => address.type === "p2wpkh"
        ).publicKey;
        const res = await axios.post(createPsbtApi, {
          senderPubkey: pubkey,
          walletType: "Hiro",
          recipient: adminAddress,
          price,
        });
        const requestParams = {
          publicKey: pubkey,
          hex: res.data.psbt,
          network: "mainnet",
        };
        const result = await window.btc?.request("signPsbt", requestParams);
        const sendPsbt = await axios.post(apiUrl, {
          psbtHex: (result as any).result.hex,
          walletType: "Hiro",
          ordinalsWallet: address,
        });
        alert("success");
        setIsloading(false);
      } catch (error) {
        console.error(error);
        alert("failed 2");
        setIsloading(false);
      }
    } else if (walletName === "Xverse") {
      try {
        let pubkey, address, paymentAddress;
        setIsloading(true);
        const getAddressOptions = {
          payload: {
            purposes: [AddressPurposes.ORDINALS, AddressPurposes.PAYMENT],
            message: "Address for receiving Ordinals and payments",
            network: {
              type: "Mainnet",
            },
          },
          onFinish: (response: any) => {
            address = response.addresses[0].address;
            pubkey = response.addresses[1].publicKey;
            paymentAddress = response.addresses[1].address;
          },
          onCancel: () => alert("Request canceled"),
        };
        await getAddress(getAddressOptions);
        if (
          !(
            currentTime < ogMintTime + 1000 * 3600 &&
            isWhiteListed(WhiteList, address)
          )
        ) {
          setIsloading(false);
          return alert("You are not whitelisted");
        }
        const res = await axios.post(createPsbtApi, {
          senderPubkey: pubkey,
          walletType: "Xverse",
          recipient: adminAddress,
          price,
        });
        let signedPsbt;
        const signPsbtOptions = {
          payload: {
            network: {
              type: "Mainnet",
            },
            message: "Sign Transaction",
            psbtBase64: res.data.psbt,
            broadcast: false,
            inputsToSign: [
              {
                address: paymentAddress,
                signingIndexes: [0, res.data.inputCount - 1],
              },
            ],
          },
          onFinish: (response: any) => {
            signedPsbt = response.psbtBase64;
          },
          onCancel: () => alert("Canceled"),
        };
        await signTransaction(signPsbtOptions);
        const sendPsbt = await axios.post(apiUrl, {
          psbtHex: signedPsbt,
          walletType: "xverse",
          ordinalsWallet: address,
        });
        setIsloading(false);
      } catch (error) {
        console.error(error);
        alert("failed 3");
        setIsloading(false);
      }
    }
  };

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="relative hidden min-h-screen w-full xl:block">
        {walletConnectModalVisible && (
          <WalletConnectModal setModalVisible={setWalletConnectModalVisible} />
        )}
        <Header setModalVisible={setWalletConnectModalVisible} />
        <Image
          src="/imgs/bg.png"
          alt=""
          fill
          className="absolute inset-0 -z-10"
        />
        <div className="mt-[146px] flex w-full justify-center px-[150px]">
          <div className="flex max-w-[1623px] justify-center gap-[90px]">
            <Image
              src="/imgs/bg-logo.png"
              alt=""
              width={640}
              height={640}
              className="aspect-square h-[640px] w-[640px] flex-none"
            />
            <div>
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-start gap-4">
                    <Image
                      src="/imgs/btc-logo.png"
                      alt=""
                      width="69"
                      height="69"
                      className="mt-3"
                    />
                    <p className="text-[40px] uppercase text-white">
                      BTC Brawlers
                    </p>
                  </div>
                  <p className="rounded border-[1px] border-[#353535] bg-[#1E1E1E] px-2.5 py-1.5 font-tomorrow text-[22px] leading-6 text-white">
                    TOTAL ITEMS {TotalAmount}
                  </p>
                  <div className="flex items-center gap-[18px]">
                    <Link href="https://discord.gg/XKhFrvnW9a" target="_blank">
                      <Image
                        src="/imgs/discord.png"
                        alt=""
                        width="38"
                        height="38"
                      />
                    </Link>
                    <Link
                      href="https://twitter.com/BTCBrawlers"
                      target="_blank"
                    >
                      <Image
                        src="/imgs/twitter.png"
                        alt=""
                        width="38"
                        height="38"
                      />
                    </Link>
                    <Link href="https://twitter.com/agznft" target="_blank">
                      <Image
                        src="/imgs/website.png"
                        alt=""
                        width="38"
                        height="38"
                      />
                    </Link>
                  </div>
                </div>
                <p className="font-tomorrow text-[22px] leading-[30px] text-specialWhite">
                  BTC Brawlers is a 333 Genesis Collection and entry into the
                  Brawlers Metaverse, stored on Bitcoin&#39;s Blocks 9 and 78
                  Inspired by classic Nintendo games like Mike Tyson&#39;s
                  Punch-Out, Street Fighter, and Double Dragon. Holders of the
                  collection receive exclusive Fighter Card Airdrops created by
                  https://twitter.com/agznft and Cornermen used to boost points.
                  Earn $SPAR points, upgrade, and build the ultimate champion!
                </p>
              </div>
              <div>
                <div className="mt-[70px] rounded-[5px] border-[1px] border-[#353535] bg-[#1E1E1E] px-14 py-10">
                  <div className="flex w-full items-center justify-between">
                    <p className="text-[35px] font-bold uppercase text-[#444]">
                      {currentTime > ogMintTime + 1000 * 3600 ? "PUBLIC" : "OG"}
                    </p>
                    {currentTime < publicMintTime && (
                      <div className="flex items-center gap-[25px]">
                        <p className="text-[35px] uppercase text-customBlue">
                          {currentTime > publicMintTime
                            ? ""
                            : ogMintTime > currentTime
                            ? "STARTS IN"
                            : "END IN"}
                        </p>
                        <p className="text-[60px] uppercase leading-[60px] text-white">
                          {Math.floor(
                            (ogMintTime - currentTime) / (1000 * 3600)
                          ) < 0
                            ? Math.floor(
                                (publicMintTime - currentTime) / (1000 * 3600)
                              ).toLocaleString("en-US", {
                                minimumIntegerDigits: 2,
                                useGrouping: false,
                              })
                            : Math.floor(
                                (ogMintTime - currentTime) / (1000 * 3600)
                              ).toLocaleString("en-US", {
                                minimumIntegerDigits: 2,
                                useGrouping: false,
                              })}
                        </p>
                        <p className="text-[60px] uppercase leading-[60px] text-white">
                          {Math.floor(
                            (((ogMintTime - currentTime) / 1000) % 3600) / 60
                          ) < 0
                            ? Math.floor(
                                (((publicMintTime - currentTime) / 1000) %
                                  3600) /
                                  60
                              ).toLocaleString("en-US", {
                                minimumIntegerDigits: 2,
                                useGrouping: false,
                              })
                            : Math.floor(
                                (((ogMintTime - currentTime) / 1000) % 3600) /
                                  60
                              ).toLocaleString("en-US", {
                                minimumIntegerDigits: 2,
                                useGrouping: false,
                              })}
                        </p>
                        <p className="text-[60px] uppercase leading-[60px] text-white">
                          {Math.floor(
                            ((ogMintTime - currentTime) / 1000) % 60
                          ) < 0
                            ? Math.floor(
                                ((publicMintTime - currentTime) / 1000) % 60
                              ).toLocaleString("en-US", {
                                minimumIntegerDigits: 2,
                                useGrouping: false,
                              })
                            : Math.floor(
                                ((ogMintTime - currentTime) / 1000) % 60
                              ).toLocaleString("en-US", {
                                minimumIntegerDigits: 2,
                                useGrouping: false,
                              })}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <Image
                      src="/imgs/btc-logo.png"
                      alt=""
                      width="28"
                      height="28"
                      className="mt-2"
                    />
                    <p className="font-tomorrow text-[40px] leading-10 text-specialWhite">
                      0.0011 BTC + FEES
                    </p>
                  </div>
                </div>
                <button
                  className="mt-[30px] flex h-[80px] w-full items-center justify-center rounded-full bg-customBlue font-tomorrow text-[32px] text-specialWhite"
                  onClick={() => void onMintBtnClicked()}
                  disabled={isLoading || ogMintTime > currentTime}
                >
                  {isLoading ? (
                    <Image
                      src="/imgs/spinner.svg"
                      alt=""
                      width={50}
                      height={50}
                    />
                  ) : (
                    "MINT"
                  )}
                </button>
                <div className="mt-[30px]">
                  <div className="h-1 w-full bg-[#3A3A3A]">
                    <div
                      className={`h-full bg-customBlue`}
                      style={{
                        width: `${Math.floor(
                          (mintedCount / TotalAmount) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1.5 flex w-full justify-between font-tomorrow text-[20px] leading-10 text-white">
                    <p>TOTAL MINTED</p>
                    <p>
                      {(mintedCount / TotalAmount).toFixed(2)}% ({mintedCount}/
                      {TotalAmount})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
      <div className="h-screen w-full bg-black text-[50px] text-white xl:hidden">
        Please use desktop
      </div>
    </>
  );
}
