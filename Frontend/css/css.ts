
import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  picker: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
