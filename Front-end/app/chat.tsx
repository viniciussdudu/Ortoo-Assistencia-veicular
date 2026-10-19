import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";

import ChatLoja from "../components/ChatLoja";

export default function Chat() {
  const { loja } = useLocalSearchParams<{ loja?: string }>();
  const nomeLoja = typeof loja === "string" && loja.trim() ? loja : "Loja parceira Ortoo";

  return (
    <>
      <Stack.Screen options={{ title: "Chat com a loja" }} />
      <ChatLoja loja={nomeLoja} />
    </>
  );
}
