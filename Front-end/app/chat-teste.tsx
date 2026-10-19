import { Stack } from "expo-router";
import React from "react";

import ChatLoja from "../components/ChatLoja";

export default function ChatTeste() {
  return (
    <>
      <Stack.Screen options={{ title: "Teste do chat" }} />
      <ChatLoja loja="Auto Socorro Rápido" testMode />
    </>
  );
}
