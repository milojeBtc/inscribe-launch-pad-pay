import Image from "next/image";
import React from "react";
import { useSelector } from "react-redux";
import {
  selectAddress,
  selectIsAuthenticated,
} from "../wallet-connect/walletConnectSlice";

const Header = ({
  setModalVisible,
}: {
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const address = useSelector(selectAddress);

  return (
    <div className="flex h-[90px] w-full items-center justify-between rounded-full bg-specialDark px-[84px]">
      <Image src="/imgs/sm-logo.svg" width={36} height={44} alt="" />
      <button
        className="rounded-full border-[1px] border-specialWhite px-7 py-2 font-tomorrow text-sm text-specialWhite"
        onClick={() => setModalVisible(true)}
        disabled={isAuthenticated}
      >
        {isAuthenticated
          ? `${(address as string).slice(0, 4)}...${(address as string).slice(
              -3
            )}`
          : "Connect"}
      </button>
    </div>
  );
};

export default Header;
