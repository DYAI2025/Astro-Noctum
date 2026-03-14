import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const result = mode === "signin" ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    if (result) {
      setError(result);
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.panel}>
          <Text style={styles.badge}>Bazodiac Mobile</Text>
          <Text style={styles.title}>{mode === "signin" ? "Welcome back" : "Create your account"}</Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#6e7784"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#6e7784"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            style={[styles.button, submitting && styles.buttonDisabled]}
            disabled={submitting}
            onPress={submit}
          >
            <Text style={styles.buttonText}>{submitting ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={styles.linkButton}
            onPress={() => setMode((prev) => (prev === "signin" ? "signup" : "signin"))}
          >
            <Text style={styles.linkText}>
              {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#060b12",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  panel: {
    backgroundColor: "#0f1823",
    borderWidth: 1,
    borderColor: "#253244",
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  badge: {
    color: "#d4af37",
    textTransform: "uppercase",
    letterSpacing: 2,
    fontSize: 11,
  },
  title: {
    color: "#f5f7fb",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2d3a4f",
    backgroundColor: "#131d2b",
    color: "#f3f6ff",
    paddingHorizontal: 14,
    fontSize: 16,
  },
  button: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#0f1823",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  linkButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: {
    color: "#a5b1c3",
    fontSize: 13,
  },
  error: {
    color: "#ff6b6b",
    fontSize: 13,
  },
});
