import { configureStore } from "@reduxjs/toolkit";
import walletConnectReducer from "~/components/wallet-connect/walletConnectSlice";

export const store = configureStore({
  reducer: {
    walletConnect: walletConnectReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
