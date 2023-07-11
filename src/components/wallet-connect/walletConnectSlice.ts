import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "~/app/store";
import { type WalletTypes } from "~/types/type";

export interface CounterState {
  address: string | undefined;
  isAuthenticated: boolean;
  walletName: WalletTypes | undefined;
}

const initialState: CounterState = {
  address: undefined,
  isAuthenticated: false,
  walletName: undefined,
};

export const walletConnectSlice = createSlice({
  name: "walletConnect",
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
    },
    walletConnect: (
      state,
      action: PayloadAction<{ address: string; walletName: WalletTypes }>
    ) => {
      state.address = action.payload.address;
      state.walletName = action.payload.walletName;
      state.isAuthenticated = true;
    },
  },
});

export const { logout, walletConnect } = walletConnectSlice.actions;

export const selectAddress = (state: RootState) => state.walletConnect.address;
export const selectIsAuthenticated = (state: RootState) =>
  state.walletConnect.isAuthenticated;
export const selectWalletName = (state: RootState) =>
  state.walletConnect.walletName;

export default walletConnectSlice.reducer;
