import Image from "next/image";
import { useEffect, useRef } from "react";
import { Wallets } from "~/types/type";

const WalletConnectModal = ({
  setModalVisible,
}: {
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const wrappedRef = useRef<HTMLDivElement>(null);

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
