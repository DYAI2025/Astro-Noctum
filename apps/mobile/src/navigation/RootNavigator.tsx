import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, type LinkingOptions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { Text } from "react-native";
import { ArticleScreen } from "../screens/ArticleScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { FuRingScreen } from "../screens/FuRingScreen";
import { QuizScreen } from "../screens/QuizScreen";
import { VoiceScreen } from "../screens/VoiceScreen";
import { WissenScreen } from "../screens/WissenScreen";
import { WuXingScreen } from "../screens/WuXingScreen";

export type RootTabParamList = {
  Dashboard: undefined;
  FuRing: undefined;
  WuXing: undefined;
  Wissen: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  Article: { slug: string };
  Voice: undefined;
  Quiz: { moduleId?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const iconLabel = (label: string) => ({ color }: { color: string }) => (
  <Text style={{ color, fontSize: 12, fontWeight: "700" }}>{label}</Text>
);

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#0f1823" },
        headerTitleStyle: { color: "#f5f7fb" },
        headerTintColor: "#f5f7fb",
        tabBarStyle: { backgroundColor: "#0f1823", borderTopColor: "#213044", minHeight: 64, paddingBottom: 8 },
        tabBarActiveTintColor: "#d4af37",
        tabBarInactiveTintColor: "#8fa0bc",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: iconLabel("D"), title: "Dashboard" }}
      />
      <Tab.Screen
        name="FuRing"
        component={FuRingScreen}
        options={{ tabBarIcon: iconLabel("F"), title: "Fu Ring" }}
      />
      <Tab.Screen
        name="WuXing"
        component={WuXingScreen}
        options={{ tabBarIcon: iconLabel("W"), title: "Wu Xing" }}
      />
      <Tab.Screen
        name="Wissen"
        component={WissenScreen}
        options={{ tabBarIcon: iconLabel("K"), title: "Wissen" }}
      />
    </Tab.Navigator>
  );
}

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/"), "bazodiac://", "https://bazodiac.space"],
  config: {
    screens: {
      Tabs: {
        screens: {
          Dashboard: "dashboard",
          FuRing: "fu-ring",
          WuXing: "wu-xing",
          Wissen: "wissen",
        },
      },
      Article: "article/:slug",
      Voice: "levi",
      Quiz: "quiz/:moduleId?",
    },
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          contentStyle: { backgroundColor: "#060b12" },
          headerStyle: { backgroundColor: "#0f1823" },
          headerTintColor: "#f5f7fb",
          headerTitleStyle: { color: "#f5f7fb" },
        }}
      >
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="Article" component={ArticleScreen} options={{ title: "Wissen" }} />
        <Stack.Screen name="Voice" component={VoiceScreen} options={{ title: "Levi Voice" }} />
        <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: "Quiz" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
