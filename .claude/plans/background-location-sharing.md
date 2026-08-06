# Plan: Background Location Sharing (works when app is closed / backgrounded)

## Goal
Location keeps being reported to the backend even when the app is backgrounded, screen is off,
and in the common "closed" case (app removed from recents / not in foreground) — so passengers
keep seeing the driver's live position.

## Critical environment constraint (confirmed with user)
- Dev testing is in **Expo Go** → background location will NOT activate there (Expo Go limitation).
- Production target is an **Android release build** (`cd android && ./gradlew assembleRelease`),
  which the native `expo-location` background task fully supports.
- Background sharing is implemented for **both** apps (RiderApp driver + UserApp passenger).

## Native dependency (both apps)
- `npx expo install expo-task-manager` (expo-location ~19.0.8 already present).
- After adding the config plugin, the native project must be regenerated once:
  `npx expo prebuild --clean` (or `expo run:android`) so the AndroidManifest / Gradle picks up
  the background-location permission + foreground service. Existing `android/` folder needs this.

## 1. app.config.js plugin + permissions (both apps)
Add `expo-location` plugin with background + foreground-service enabled and permission strings.
- Android: add explicit `ACCESS_BACKGROUND_LOCATION` + `FOREGROUND_SERVICE_LOCATION` permissions.
- iOS (for completeness; primary target is Android): add
  `NSLocationAlwaysAndWhenInUseUsageDescription` and `UIBackgroundModes: ["location"]`.

## 2. New `services/backgroundLocation.ts` (one per app)
- `TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ...)` registered at module load.
  Each run: read persisted "sharing context" (userId, destination, status) + token from
  AsyncStorage, call the app's existing `updateLocation()` (REST) to POST the new coords.
- `startBackgroundLocation({ userId, destination, status })`:
  - request background permission (`requestBackgroundPermissionsAsync`, prefixed by foreground);
  - persist context to AsyncStorage;
  - `Location.startLocationUpdatesAsync(task, { accuracy, timeInterval ~3s, distanceInterval ~5,
    activityType: OtherNavigation, pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true (iOS),
    foregroundService: { notificationTitle, notificationBody, notificationColor } })` —
    the Android **foreground service notification** is what keeps updates alive when the app is
    swiped away / screen is locked.
  - no-op gracefully if background location unavailable or running in Expo Go.
- `stopBackgroundLocation()`: remove context, `Location.stopLocationUpdatesAsync(task)` if started.
- Uses REST (no socket) because a background task has no live Socket.IO connection.

## 3. Hook integration (both apps: `hooks/location/useLocationSharing.ts`)
- `startSharing(...)` → also `startBackgroundLocation({ userId, destination, status })`
  (driver: when on-duty; passenger: when an active trip / destination starts).
- `stopSharing(...)` → also `stopBackgroundLocation()`.
- Keep the existing foreground `watchPositionAsync`/polling for immediate real-time UX; the
  background task is the safety net that keeps reporting when the app leaves the foreground.

## 4. Backend: keep live push alive when driver updates from background (low risk)
- Extract the per-driver "broadcast driver-location-updated to all of the driver's active-trip
  passengers" logic (currently inside `socket/handlers/locationHandler.ts`) into a shared
  helper `socket/broadcastLocation.ts`: `broadcastDriverLocation(io, driverId, currentLocation)`.
- Create a module-level `io` holder (in `connectionManager.ts`) that `initSocket(setIo)` populates.
- In `controllers/location/LocationController.updateDriverLocation`, after persisting, call
  `broadcastDriverLocation(...)` so a backgrounded driver's REST update still pushes live to
  onboarded passengers (matches existing socket behaviour). Passenger map already picks it up via
  10s `fetchAllLocations` polling regardless.
- Note: driver-initiated **proximity auto-complete** stays socket-only and is intentionally paused
  while the driver is backgrounded (it relies on the driver's explicit socket traffic); the
  passenger can still complete/cancel manually.

## 5. Post-merge verification
- `npx tsc --noEmit` in Backend, UserApp, RiderApp (all currently 0 errors).
- Rebuild note: background feature only takes effect on a dev/release native build, not Expo Go.

## Honest platform limits (will be stated in the summary)
- Android: survives background / screen-off / swiped-from-recents via the foreground-service
  notification. OS-level "Force stop" from Settings cannot be overridden — no app can.
- iOS: continues while backgrounded with Always permission + background mode; after the user
  removes the app from the app switcher, continuous delivery is not guaranteed by the OS
  (only significant-location-change resumes) — a platform limitation.
- The background channel is REST; real-time socket push during backgrounded-on-duty driving is
  handled by the backend broadcast helper above.
