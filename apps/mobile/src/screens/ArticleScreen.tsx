import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { WISSEN_ARTICLES } from "../content/articles";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Article">;

export function ArticleScreen({ route }: Props) {
  const article = useMemo(
    () => WISSEN_ARTICLES.find((item) => item.slug === route.params.slug),
    [route.params.slug],
  );

  if (!article) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Article missing</Text>
        <Text style={styles.emptyBody}>The requested content is not available in this build.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.category}>{article.category}</Text>
      <Text style={styles.title}>{article.title}</Text>
      <Text style={styles.meta}>{article.readingTime} min read</Text>
      {article.body.map((paragraph) => (
        <Text key={paragraph} style={styles.body}>
          {paragraph}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: "#060b12",
  },
  category: {
    color: "#d4af37",
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 1.2,
  },
  title: {
    color: "#f4f7fb",
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
  },
  meta: {
    color: "#94a8c1",
    fontSize: 12,
  },
  body: {
    color: "#d2ddec",
    lineHeight: 24,
    fontSize: 15,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#060b12",
    gap: 8,
  },
  emptyTitle: {
    color: "#f4f7fb",
    fontSize: 20,
    fontWeight: "700",
  },
  emptyBody: {
    color: "#95a8c1",
    textAlign: "center",
  },
});
