import { Platform, Alert } from "react-native";

export const ShowAlert = (title : string, message : string) => {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
};