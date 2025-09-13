import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type HashPowerContextType = {
  hashPower: number;
  setHashPower: (val: number) => void;
  addHashPower: (val: number) => void;
};

const HashPowerContext = createContext<HashPowerContextType | undefined>(undefined);

export const HashPowerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hashPower, setHashPowerState] = useState(0);

  // Load on mount
  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem("hashPower");
      if (stored) setHashPowerState(parseInt(stored));
    };
    load();
  }, []);

  // Save whenever hashPower changes
  useEffect(() => {
    AsyncStorage.setItem("hashPower", hashPower.toString());
  }, [hashPower]);

  const setHashPower = (val: number) => setHashPowerState(val);
  const addHashPower = (val: number) => setHashPowerState((prev) => prev + val);

  return (
    <HashPowerContext.Provider value={{ hashPower, setHashPower, addHashPower }}>
      {children}
    </HashPowerContext.Provider>
  );
};

export const useHashPower = () => {
  const ctx = useContext(HashPowerContext);
  if (!ctx) throw new Error("useHashPower must be used inside HashPowerProvider");
  return ctx;
};
