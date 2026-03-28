# Signatur Cousto Audio — Manual Test Runbook

**Sprint:** S-SIG Phase 2
**Scope:** Cousto frequency audio synthesis on web browsers
**Prerequisite:** Local dev running (`npm run dev`)

---

## 1. Audio Playback

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1.1 | Audio starts on mount | Navigate to `/signatur` | Ambient Cousto tone plays automatically (after user gesture on Safari) |
| 1.2 | Six frequencies audible | Listen for tonal variety | 6 oscillators: Mars (144.72 Hz), Moon (210.42 Hz), Sun (126.22 Hz), Mercury (141.27 Hz), Jupiter (183.58 Hz), Saturn (147.85 Hz) |
| 1.3 | Pole weight → gain | Complete quizzes to change pole weights | Stronger pole weights produce louder corresponding oscillator |
| 1.4 | Smooth transitions | Change data (quiz completion, transit update) | Oscillator gain ramps smoothly (300ms linear ramp), no clicks or pops |

## 2. UI Controls

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 2.1 | Mute toggle | Click mute button on `/signatur` header | Audio silences immediately; icon changes to VolumeX |
| 2.2 | Unmute toggle | Click mute button again | Audio resumes; icon changes to Volume2 |
| 2.3 | Volume slider | Drag volume slider | Master gain adjusts proportionally; value persisted |
| 2.4 | Persistence | Mute, navigate away, return to `/signatur` | Mute state restored from localStorage |
| 2.5 | Volume persistence | Set volume to ~30%, navigate away, return | Volume slider at ~30% position, audio at 30% gain |

## 3. Lifecycle

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 3.1 | Tab hidden | Switch to another tab | AudioContext suspended (no CPU drain) |
| 3.2 | Tab visible | Return to tab | AudioContext resumed, audio continues seamlessly |
| 3.3 | Page navigation | Navigate from `/signatur` to `/` | Audio stops cleanly, no orphaned AudioContext |
| 3.4 | Return to Signatur | Navigate back to `/signatur` | New AudioContext created, audio restarts |
| 3.5 | Rapid navigation | Navigate away and back 5x quickly | No audio glitches, no duplicate AudioContexts |

## 4. Safari / iOS

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 4.1 | User gesture required | Open `/signatur` on iOS Safari (cold start) | Audio does NOT auto-play until user taps/clicks |
| 4.2 | Gesture unlocks audio | Tap anywhere on the page | AudioContext.resume() fires, audio begins |
| 4.3 | Background tab | Switch Safari tabs on iOS | Audio suspends (iOS policy) |
| 4.4 | Return from background | Return to tab | Audio resumes after short delay |
| 4.5 | Desktop Safari | Open `/signatur` on macOS Safari | Same gesture-required behavior, audio starts on click |

## 5. Edge Cases

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 5.1 | No WebAudio | Test in environment without Web Audio API | No crash; audio controls hidden or disabled |
| 5.2 | Zero weights | All pole weights at 0 | Silence — all oscillator gains at 0, no error |
| 5.3 | Max weights | All pole weights at 1 | Full volume, no clipping distortion |
| 5.4 | Levi agent active | Start Levi voice call while audio playing | Ambient audio pauses (Levi takes audio priority) |
| 5.5 | Levi agent ends | End Levi voice call | Ambient audio resumes if unmuted |
