# Mobile Phase 1: Launchable 3-Tab App

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the 4-tab wireframe app into a clean 3-tab structure with real icons, correct naming ("Signatur" not "Fu Ring"), and a ProfileScreen — making it ready for EAS builds and simulator testing.

**Architecture:** Remove WuXing and Wissen tabs (their content moves inline to the Home screen in Phase 2). Add a ProfileScreen with settings, tier display, and logout. Replace letter-icons with `@expo/vector-icons` (Ionicons). Rename all user-facing "Fu Ring" references to "Signatur".

**Tech Stack:** React Native 0.79, Expo 53, React Navigation v7, @expo/vector-icons (Ionicons), TypeScript

---

## Context for Implementor

### Where is the mobile app?
```
apps/mobile/          ← root (run commands from here)
apps/mobile/App.tsx   ← entry point
apps/mobile/src/      ← all source code
```

All paths in this plan are relative to the monorepo root: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/`

### How to verify changes?
No simulator build is possible locally (Xcode 26 incompatible with RN 0.79). Use:
```bash
cd apps/mobile && npx tsc --noEmit   # TypeScript check
cd apps/mobile && npx expo start     # Metro bundler (verifies JS loads)
```

### What is the current tab structure?
4 tabs: Dashboard | Fu Ring | Wu Xing | Wissen — with letter icons ("D", "F", "W", "K")

### What is the target tab structure?
3 tabs: Home | Quizzes | Profil — with Ionicons (home, sparkles, person)

---

### Task 1: Install @expo/vector-icons

**Files:**
- Modify: `apps/mobile/package.json`

**Step 1: Install the icon package**

```bash
cd apps/mobile && npx expo install @expo/vector-icons
```

`@expo/vector-icons` ships with Expo but installing explicitly ensures version compatibility.

**Step 2: Verify it resolves**

```bash
cd apps/mobile && node -e "require('@expo/vector-icons')" && echo "OK"
```

Expected: `OK` (no error)

**Step 3: Commit**

```bash
git add apps/mobile/package.json apps/mobile/package-lock.json
git commit -m "chore(mobile): install @expo/vector-icons"
```

---

### Task 2: Create ProfileScreen

**Files:**
- Create: `apps/mobile/src/screens/ProfileScreen.tsx`

**Step 1: Create the ProfileScreen**

```typescript
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useAppState } from "../contexts/AppStateContext";
import { COLORS } from "../theme";

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile, tier, refreshProfile } = useAppState();

  const handleSignOut = () => {
    Alert.alert("Abmelden", "Möchtest du dich wirklich abmelden?", [
      { text: "Abbrechen", style: "cancel" },
      { text: "Abmelden", style: "destructive", onPress: () => void signOut() },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Account */}
      <View style={styles.card}>
        <Text style={styles.kicker}>ACCOUNT</Text>
        <Text style={styles.value}>{user?.email ?? "—"}</Text>
      </View>

      {/* Tier */}
      <View style={styles.card}>
        <Text style={styles.kicker}>MITGLIEDSCHAFT</Text>
        <View style={styles.tierRow}>
          <Text style={[styles.tierBadge, tier === "premium" && styles.tierPremium]}>
            {tier === "premium" ? "✦ Premium" : "Free"}
          </Text>
        </View>
      </View>

      {/* Profile Summary */}
      <View style={styles.card}>
        <Text style={styles.kicker}>KOSMISCHES PROFIL</Text>
        <Text style={styles.value}>
          {profile?.sun_sign || "—"} ☉ · {profile?.moon_sign || "—"} ☽ · {profile?.asc_sign || "—"} ↑
        </Text>
        <Text style={styles.meta}>
          Berechnet: {profile?.astro_computed_at
            ? new Date(profile.astro_computed_at).toLocaleDateString("de-DE")
            : "—"}
        </Text>
      </View>

      {/* Actions */}
      <Pressable style={styles.actionButton} onPress={() => void refreshProfile()}>
        <Text style={styles.actionText}>Profil aktualisieren</Text>
      </Pressable>

      <Pressable style={[styles.actionButton, styles.destructive]} onPress={handleSignOut}>
        <Text style={styles.destructiveText}>Abmelden</Text>
      </Pressable>

      {/* Version */}
      <Text style={styles.version}>Bazodiac v0.1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  kicker: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
  value: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  meta: {
    color: COLORS.textDim,
    fontSize: 12,
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tierBadge: {
    color: COLORS.textDim,
    fontSize: 16,
    fontWeight: "700",
  },
  tierPremium: {
    color: COLORS.gold,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  actionText: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 15,
  },
  destructive: {
    borderColor: "rgba(220, 50, 50, 0.3)",
    backgroundColor: "rgba(220, 50, 50, 0.08)",
  },
  destructiveText: {
    color: "#dc3232",
    fontWeight: "600",
    fontSize: 15,
  },
  version: {
    color: COLORS.textDim,
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
    opacity: 0.5,
  },
});
```

**Step 2: Verify it compiles**

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | grep ProfileScreen
```

Expected: No errors mentioning ProfileScreen

**Step 3: Commit**

```bash
git add apps/mobile/src/screens/ProfileScreen.tsx
git commit -m "feat(mobile): add ProfileScreen with account, tier, and logout"
```

---

### Task 3: Rebuild RootNavigator with 3 tabs and real icons

**Files:**
- Modify: `apps/mobile/src/navigation/RootNavigator.tsx`

**Step 1: Rewrite RootNavigator.tsx**

Replace the entire file with:

```typescript
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
```

**What changed:**
- 4 tabs → 3 tabs (Home, Quizzes, Profil)
- Letter icons → Ionicons (home-outline, sparkles-outline, person-outline)
- WuXing + Wissen tabs removed (content moves to Home in Phase 2)
- Article stack screen removed (no Wissen tab = no articles)
- Quiz moved from stack to tab (QuizScreen is now a main tab, not a modal push)
- FuRing remains as a stack screen accessible from Home ("Signatur" button)
- Deep links updated

**Step 2: Verify typecheck**

```bash
cd apps/mobile && npx tsc --noEmit
```

Expected: No new errors (pre-existing RN type issues are OK)

**Step 3: Commit**

```bash
git add apps/mobile/src/navigation/RootNavigator.tsx
git commit -m "refactor(mobile): 3-tab layout with Ionicons (Home, Quizzes, Profil)"
```

---

### Task 4: Update DashboardScreen with Signatur link and German text

**Files:**
- Modify: `apps/mobile/src/screens/DashboardScreen.tsx`

**Step 1: Update the DashboardScreen**

Key changes:
- Remove "Open Levi Voice" and "Quiz Signals" buttons (they're now tabs or stack screens)
- Add "Signatur öffnen" button that navigates to the Signatur stack screen
- Change English labels to German (matching bazodiac.space)
- Keep: Cosmic Profile card, Space Weather card, Interpretation card, Share + Upgrade row

Replace the action rows (lines 102-126) with:

```tsx
      <Pressable
        style={styles.signaturButton}
        onPress={() => navigation.navigate("Signatur")}
      >
        <Text style={styles.signaturText}>✦ Signatur öffnen</Text>
      </Pressable>

      <View style={styles.actionRow}>
        <Pressable style={[styles.actionButton, styles.secondary]} onPress={openShare} disabled={busyShare}>
          <Text style={styles.secondaryText}>{busyShare ? "..." : "Teilen"}</Text>
        </Pressable>

        {tier !== "premium" ? (
          <Pressable style={[styles.actionButton, styles.premium]} onPress={openUpgrade} disabled={busyCheckout}>
            <Text style={styles.premiumText}>{busyCheckout ? "..." : "Upgrade"}</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.actionButton, styles.secondary]} onPress={() => void refreshProfile()}>
            <Text style={styles.secondaryText}>Aktualisieren</Text>
          </Pressable>
        )}
      </View>
```

Also update the card labels to German:
- "Cosmic Profile" → "Kosmisches Profil"
- "Space Weather" → "Weltraumwetter"
- "Interpretation" → "KI-Deutung"

Add the signatur button style:
```typescript
  signaturButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  signaturText: {
    color: "#060b12",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
```

Update the RootStackParamList import (it changed in Task 3):
```typescript
import type { RootStackParamList } from "../navigation/RootNavigator";
```

**Step 2: Verify typecheck**

```bash
cd apps/mobile && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add apps/mobile/src/screens/DashboardScreen.tsx
git commit -m "feat(mobile): German labels, Signatur CTA, remove redundant nav buttons"
```

---

### Task 5: Rename "Fu Ring" to "Signatur" in FuRingScreen

**Files:**
- Modify: `apps/mobile/src/screens/FuRingScreen.tsx`

**Step 1: Read the file and replace all user-facing text**

Change:
- Any title/label containing "Fu Ring", "Fusion Ring", or "FuRing" → "Signatur"
- Keep the component name `FuRingScreen` and filename (code-internal, not user-facing)

**Step 2: Verify typecheck**

```bash
cd apps/mobile && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add apps/mobile/src/screens/FuRingScreen.tsx
git commit -m "content(mobile): rename Fu Ring to Signatur in user-facing text"
```

---

### Task 6: Clean up dead imports and verify Metro starts

**Files:**
- Possibly modify: `apps/mobile/src/screens/DashboardScreen.tsx` (remove unused imports)
- Verify: all screens still type-check

**Step 1: Run typecheck**

```bash
cd apps/mobile && npx tsc --noEmit
```

Fix any errors (likely unused imports from removed navigation targets).

**Step 2: Start Metro to verify JS bundle loads**

```bash
cd apps/mobile && npx expo start --clear 2>&1 | head -20
```

Expected: "Metro waiting on..." — no red errors. Press `Ctrl+C` to stop.

**Step 3: Commit any cleanup**

```bash
git add apps/mobile/
git commit -m "chore(mobile): clean up dead imports after tab restructure"
```

---

### Task 7: Trigger EAS cloud build

**Step 1: Push the branch**

```bash
git push -u origin feature/mobile-phase1
```

**Step 2: Start EAS simulator build**

```bash
cd apps/mobile && eas build --platform ios --profile simulator --non-interactive
```

**Step 3: Wait for build and report URL**

EAS will print a build URL. When complete, download the `.app` file and test on simulator:

```bash
# After build completes and .tar.gz is downloaded:
xcrun simctl boot "iPhone 15 Pro"
xcrun simctl install "iPhone 15 Pro" /path/to/Bazodiac.app
xcrun simctl launch "iPhone 15 Pro" space.bazodiac.mobile
```

**Step 4: Commit build artifacts if any**

```bash
git add apps/mobile/
git commit -m "chore(mobile): update EAS config after successful build"
```

---

## Summary

| Task | What | Files changed |
|------|------|---------------|
| 1 | Install vector icons | package.json |
| 2 | Create ProfileScreen | new ProfileScreen.tsx |
| 3 | 3-tab RootNavigator with Ionicons | RootNavigator.tsx |
| 4 | German labels + Signatur CTA in Dashboard | DashboardScreen.tsx |
| 5 | Rename Fu Ring → Signatur | FuRingScreen.tsx |
| 6 | Clean dead imports, verify Metro | Various |
| 7 | EAS cloud build | — |

**Expected result:** A 3-tab app (Home / Quizzes / Profil) with real icons, German labels, and a gold "Signatur öffnen" CTA that opens the Signatur visualization. Verified via EAS simulator build.
