import Image from "next/image";
import { useEffect, useRef } from "react";
import { Wallets } from "~/types/type";
import "@btckit/types";
import { BtcAddress } from "@btckit/types";
import { useDispatch } from "react-redux";
import { walletConnect } from "./walletConnectSlice";
import {
  type GetAddressOptions,
  AddressPurposes,
  getAddress,
  type GetAddressResponse,
} from "sats-connect";

const WalletConnectModal = ({
  setModalVisible,
}: {
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const wrappedRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

  const handleClickOutside = (event: MouseEvent) => {
    if (
      wrappedRef.current &&
      !wrappedRef.current.contains(event.target as Node)
    ) {
      setModalVisible(false);
    }
  };
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const walletConnectBtnClicked = async (walletName: string) => {
    if (walletName === "Hiro") {
      try {
        const addressesRes = await window.btc?.request("getAddresses", {
          types: ["p2tr"],
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const { address } = (addressesRes as any).result.addresses.find(
          (address: BtcAddress) => address.type === "p2tr"
        );
        dispatch(walletConnect({ address, walletName: "Hiro" }));
        setModalVisible(false);
      } catch (err) {
        alert("Wallet is not installed or User canceled");
      }
    } else if (walletName === "Xverse") {
      try {
        const getAddressOptions: GetAddressOptions = {
          payload: {
            purposes: [AddressPurposes.ORDINALS],
            message: "Address for receiving Ordinals",
            network: {
              type: "Mainnet",
            },
          },
          onFinish: (response: GetAddressResponse) => {
            const address = (response as any).addresses[0].address;
            dispatch(walletConnect({ address, walletName: "Xverse" }));
            setModalVisible(false);
          },
          onCancel: () => {
            setModalVisible(false);
          },
        };
        await getAddress(getAddressOptions);
      } catch (err) {
        alert("Wallet is not installed or User canceled");
      }
    } else if (walletName === "Unisat") {
      try {
        const addresses = (await (
          window as any
        ).unisat?.requestAccounts()) as string[];
        dispatch(
          walletConnect({
            address: addresses[0] as string,
            walletName: "Unisat",
          })
        );
        setModalVisible(false);
      } catch (err) {
        alert("Wallet is not installed or User canceled");
      }
    }
  };

  return (
    <div className="absolute left-0 top-0 z-20 flex h-screen w-full items-center justify-center bg-black bg-opacity-80">
      <div
        ref={wrappedRef}
        className="relative w-[676px] rounded-[15px] border-[1px] border-[#575757] bg-[#161616] px-14 pb-[80px] pt-[100px]"
      >
        <Image
          src="/imgs/close.png"
          width={56}
          height={56}
          alt=""
          className="absolute right-6 top-6"
          onClick={() => setModalVisible(false)}
        />
        <p className="text-[28px] font-bold uppercase text-white">
          Connect a wallet to continue
        </p>
        <p className="mt-8 font-tomorrow text-2xl tracking-[-0.24px] text-[#EFE9E6]">
          {`Choose how you want to connect. If you don't have a wallet, you can select a provider and create one.`}
        </p>
        <div className="mt-[50px] h-[1px] w-full bg-[#515151]" />
        <p className="mt-[38px] font-tomorrow text-[20px] tracking-[-0.24px] text-[#2DB0B0]">
          {`Using Hiro and Xverse wallets simultaneously causes issues with
          signing transactions and may lead to unexpected behavior. For a safe
          experience, disconnect from ME website and disable one of the wallets
          on your browser, as they interfere with each other's functions in the
          browser.`}
        </p>
        <div className="mt-9 flex w-full flex-col gap-8">
          {Wallets.map((wallet, index) => (
            <button
              key={index}
              className="group flex w-full items-center justify-between rounded-full border-[1px] border-[#EFE9E6] px-10 py-5"
              onClick={() => void walletConnectBtnClicked(wallet.name)}
            >
              <div className="flex items-center gap-[22px]">
                <Image src={wallet.imgUrl} alt="" width={54} height={54} />
                <p className="font-tomorrow tracking-[-0.24px] text-[#EFE9E6]">
                  {wallet.name}
                </p>
              </div>
              <div className="h-9 w-9 rounded-full border-[1px] border-[#EFE9E6] p-2">
                <div className="h-full w-full rounded-full group-hover:bg-[#2DB0B0]" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletConnectModal;
