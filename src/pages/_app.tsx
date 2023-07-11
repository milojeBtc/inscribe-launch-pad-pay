import { type AppType } from "next/dist/shared/lib/utils";
import "~/styles/globals.css";
import { Tomorrow } from "next/font/google";
import { Inter } from "next/font/google";
import { store } from "~/app/store";
import { Provider } from "react-redux";

const tomorrow = Tomorrow({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-tomorrow",
});

const inter = Inter({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-inter",
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <Provider store={store}>
      <main className={`${tomorrow.className} ${inter.className}`}>
        <Component {...pageProps} />
      </main>
    </Provider>
  );
};

export default MyApp;
