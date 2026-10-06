import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
        console.log("Splash screen hidden");
      } catch (error) {
        console.log("Splash error:", error);
      }
    };

    hideSplash();
  }, []);

  return <Slot />;
}