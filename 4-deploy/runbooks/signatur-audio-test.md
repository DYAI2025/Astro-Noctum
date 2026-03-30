# Signatur Cousto Audio Manual Test Runbook

## Purpose

Manual test scenarios for the Cousto-frequency audio layer integrated with the Signatur engine -- covering user-initiated playback, mute/volume controls, visibility API pause, iOS Safari gesture requirements, per-pole frequency differentiation, and cleanup on navigation.

## Prerequisites

- App running locally (`npm run dev` + `PORT=3001 node server.mjs`) or deployed to staging
- Authenticated user with completed onboarding
- Audio output available (speakers or headphones)
- Devices: desktop browser (Chrome/Firefox/Safari) and iOS Safari (physical device or Xcode simulator)
- Browser DevTools open (Console tab for AudioContext state logs)

## Test Scenarios

### 1. Audio Starts on User Interaction

**Steps:**
1. Navigate to `/signatur`
2. Do NOT click or tap anything -- observe the page for 5 seconds
3. Click or tap anywhere on the ring area

**Expected:**
- No audio plays on page load (browser autoplay policy)
- After the first user interaction (click/tap), audio begins
- Console: AudioContext state transitions from `suspended` to `running`

### 2. Mute and Volume Controls

**Steps:**
1. Navigate to `/signatur` and trigger audio via a click
2. Locate the audio mute/volume controls in the UI
3. Toggle mute on
4. Toggle mute off
5. Adjust volume slider (if present) from max to min and back

**Expected:**
- Mute immediately silences audio; unmute restores it without restarting the audio stream
- Volume slider changes loudness proportionally
- No audio pops or clicks during mute/unmute transitions
- Control state persists visually (mute icon changes, slider position updates)

### 3. Tab Switch Pauses Audio (Visibility API)

**Steps:**
1. Navigate to `/signatur` and trigger audio
2. Confirm audio is playing
3. Switch to a different browser tab (or minimize the window)
4. Wait 3 seconds
5. Switch back to the Signatur tab

**Expected:**
- Audio pauses within 1 second of leaving the tab
- Audio resumes within 1 second of returning to the tab
- No audio glitch, pop, or doubled playback on resume
- Console: look for `visibilitychange` or AudioContext `suspend`/`resume` logs

### 4. iOS Safari Gesture Requirement

**Steps:**
1. Open `/signatur` in Safari on an iOS device (or Xcode simulator)
2. Page loads -- observe that no audio plays
3. Tap anywhere on the ring or page

**Expected:**
- Audio does not play until the first user gesture (iOS WebKit requirement)
- After tap, audio begins normally
- No error in console about blocked AudioContext
- If AudioContext creation failed pre-gesture, it recovers after the tap

### 5. Per-Pole Frequency Differentiation

**Steps:**
1. Navigate to `/signatur` with V3 enabled and audio playing
2. Listen to the audio output carefully
3. If the UI allows pole isolation or focus (hover/tap on individual poles), interact with different poles

**Expected:**
- Different poles produce audibly different Cousto frequencies (pitch variation)
- The overall audio is a blend of multiple frequencies, not a single tone
- Frequency changes are smooth (no abrupt pitch jumps when pole weights shift)
- If poles change due to quiz completion or transit data, the audio mix updates accordingly

### 6. Audio Stops on Page Navigation

**Steps:**
1. Navigate to `/signatur` and trigger audio
2. Confirm audio is playing
3. Navigate to a different route (e.g., click Dashboard `/` or Wu-Xing `/wu-xing`)
4. Listen for any residual audio

**Expected:**
- Audio stops completely when leaving `/signatur`
- No lingering AudioContext or oscillator nodes (check DevTools Memory if needed)
- Navigating back to `/signatur` requires a new user interaction to restart audio
- Console: no errors about orphaned audio nodes

### 7. Audio Under Load (Performance)

**Steps:**
1. Navigate to `/signatur` with V3 enabled, audio playing
2. Open DevTools Performance tab, record for 10 seconds
3. Check for audio-related frame drops

**Expected:**
- Audio processing does not cause visible frame drops in the ring animation
- CPU usage from AudioContext/oscillators stays below 5% (check Performance tab breakdown)
- No audio crackling or buffer underruns

## Verification Checklist

- [ ] Audio does not autoplay on page load (all browsers)
- [ ] First user interaction starts audio successfully
- [ ] Mute/unmute works without pops or restarts
- [ ] Volume control adjusts loudness proportionally
- [ ] Tab switch pauses audio; returning resumes it
- [ ] iOS Safari respects gesture gate -- no audio before first tap
- [ ] Different poles produce different audible frequencies
- [ ] Audio stops cleanly on navigation away from `/signatur`
- [ ] No performance degradation from audio processing
