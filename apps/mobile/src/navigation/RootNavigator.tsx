import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, type LinkingOptions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { DashboardScreen } from "../screens/DashboardScreen";
import { QuizScreen } from "../screens/QuizScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { VoiceScreen } from "../screens/VoiceScreen";
import { FuRingScreen } from "../screens/FuRingScreen";

export type RootTabParamList = {
  Home: undefined;
  Quizzes: undefined;
  Profil: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  Voice: undefined;
  Signatur: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#0f1823" },
        headerTitleStyle: { color: "#f5f7fb" },
        headerTintColor: "#f5f7fb",
        tabBarStyle: {
          backgroundColor: "#0f1823",
          borderTopColor: "#213044",
          minHeight: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: "#d4af37",
        tabBarInactiveTintColor: "#8fa0bc",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Quizzes"
        component={QuizScreen}
        options={{
          title: "Quizzes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
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
          Home: "dashboard",
          Quizzes: "quizzes",
          Profil: "profil",
        },
      },
      Voice: "levi",
      Signatur: "signatur",
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
        <Stack.Screen name="Voice" component={VoiceScreen} options={{ title: "Levi Voice" }} />
        <Stack.Screen name="Signatur" component={FuRingScreen} options={{ title: "Signatur" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
