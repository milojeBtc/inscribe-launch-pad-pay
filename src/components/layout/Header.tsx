import Image from "next/image";
import React from "react";

const Header = ({
  setModalVisible,
}: {
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div className="flex h-[90px] w-full items-center justify-between rounded-full bg-specialDark px-[84px]">
      <Image src="/imgs/sm-logo.svg" width={36} height={44} alt="" />
      <button
        className="rounded-full border-[1px] border-specialWhite px-7 py-2 font-tomorrow text-sm text-specialWhite"
        onClick={() => setModalVisible(true)}
      >
        Connect
      </button>
    </div>
  );
};

export default Header;
