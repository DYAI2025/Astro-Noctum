import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { WISSEN_ARTICLES } from "../content/articles";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAppState } from "../contexts/AppStateContext";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function WissenScreen() {
  const navigation = useNavigation<Navigation>();
  const { bootstrap } = useAppState();
  const enabled = bootstrap?.feature_flags.wissen_enabled ?? true;

  if (!enabled) {
    return (
      <View style={styles.disabledState}>
        <Text style={styles.disabledTitle}>Wissen Disabled</Text>
        <Text style={styles.disabledBody}>This module is currently behind a remote flag for staged rollout.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={WISSEN_ARTICLES}
      keyExtractor={(item) => item.slug}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => navigation.navigate("Article", { slug: item.slug })}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{item.readingTime} min read</Text>
          <Text style={styles.excerpt}>{item.excerpt}</Text>
        </Pressable>
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wissen</Text>
          <Text style={styles.headerBody}>Cached educational articles with deep-link detail routes.</Text>
        </View>
      }
      ListFooterComponent={
        <View style={styles.footerActions}>
          <Pressable style={styles.button} onPress={() => navigation.navigate("Voice") }>
            <Text style={styles.buttonText}>Open Levi Voice</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("Quiz") }>
            <Text style={styles.secondaryText}>Open Quiz Modules</Text>
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 12,
    backgroundColor: "#060b12",
  },
  header: {
    marginBottom: 4,
    gap: 4,
  },
  headerTitle: {
    color: "#f4f7fb",
    fontSize: 24,
    fontWeight: "700",
  },
  headerBody: {
    color: "#9cb1cb",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#0f1823",
    borderColor: "#213142",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  category: {
    color: "#d4af37",
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 1.2,
  },
  title: {
    color: "#f3f7fc",
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    color: "#98adc8",
    fontSize: 12,
  },
  excerpt: {
    color: "#d0dced",
    fontSize: 14,
    lineHeight: 21,
  },
  footerActions: {
    marginTop: 10,
    gap: 10,
    paddingBottom: 28,
  },
  button: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#1a2a3d",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#e4ecf8",
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    color: "#101826",
    fontWeight: "800",
  },
  disabledState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#060b12",
    padding: 24,
    gap: 8,
  },
  disabledTitle: {
    color: "#f4f7fb",
    fontWeight: "700",
    fontSize: 20,
  },
  disabledBody: {
    color: "#9cb1cb",
    textAlign: "center",
    lineHeight: 21,
  },
});
