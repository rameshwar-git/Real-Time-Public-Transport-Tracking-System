# Live tracking, GPS button, and drive mode

## Goal
Make both the UserApp (passenger) and RiderApp (driver) show live locations properly and drive the driver with navigation.

Requirements:
1. GPS button → show the current location of the **vehicle** (UserApp ride) / the **driver** (RiderApp).
2. The driver's **route updates periodically** on the map.
3. **Drive mode** (turn-by-turn) in RiderApp when a destination is set.
4. A **new incoming passenger request** appears on the driver's map **without** altering the current route.
5. The passenger's **current location + distance** update periodically to the driver.

## Current state (verified)
- Both apps already have a GPS button (`MapViewComponent.tsx`) but it centers on the **static startup `origin`**, not the moving driver.
- UserApp already auto-follows the assigned driver and refreshes the driver→destination polyline every 10s (`routeRefreshKey`). Its GPS button *conflicts* with the follow (re-centers on stale `origin`).
- RiderApp auto-follows the driver's own location when on-duty with a destination, but the route polyline uses the **static `origin`** (doesn't reroute as the driver moves).
- RiderApp has **no turn-by-turn** navigation at all.
- Incoming requests surface only as a top card — no map marker.
- Backend broadcasts driver→passenger (`driver-location-updated`) but **not** passenger→driver.

---

## 1. GPS button (both apps)

**UserApp `components/map/MapViewComponent.tsx` — `handleCenterOnUser`:**
- If `isTracking && assignedDriverLocation` → center on the **vehicle** (`toGpsRegion(assignedDriverLocation)`).
- Else → center on `origin` (the passenger's own location).
- Sets `isAnimatingRef` like existing handlers.

**RiderApp `components/map/MapViewComponent.tsx` — `handleCenterOnUser`:**
- Center on the driver's **live** `ownLocation` (from `locations` feed), falling back to `origin`. Keeps it following the moving driver.

## 2. Periodic route updates (RiderApp)
- Route polyline origin → use live `ownLocation || origin` so it reroutes as the driver moves.
- Add an internal interval that bumps a `routeRefreshKey` (passed as `key` to `MapViewDirections`, mirroring the UserApp pattern) every ~10s while a route is on screen, forcing Google to re-fetch.
- UserApp needs no change (already refreshes every 10s).

## 3. Drive mode (RiderApp) — new files
- **`services/directions.ts`** (NEW): `fetchDirections(origin, destination)` calls the Google Directions API and returns `steps[]` (`maneuver`, `html_instructions`, `start_location`, `end_location`, `distance.text`) + leg `distance`/`duration`.
- **`hooks/driver/useDriveMode.ts`** (NEW): given live `origin`, `destination`, `isOnDuty`, `activeTrips` —
  - Activates when a destination is set AND (`isNavigating` toggled by the driver **or** an `in_progress` trip exists).
  - Fetches steps on activation; refreshes ~every 30s.
  - Advances to the next step when the driver's live location is within ~40 m of the current step's `end_location`.
  - Returns `{ isNavigating, maneuver, distanceToNext, remainingDistanceText, remainingDuration, startNavigation, stopNavigation }`.
- **`components/driver/DriveModeBanner.tsx`** (NEW): top banner with maneuver icon + text ("Turn right onto Main St"), "in X m", remaining time/distance, and Start / End navigation control.
- Wire into **`useDriverDashboard.ts`** (return nav state) and **`app/(tabs)/index.tsx`** (render the banner over the map).
- Drive mode intentionally does **not** modify the route polyline or the camera auto-follow; it layers an instruction UI on top.

## 4. Incoming request on map (RiderApp)
- Thread `incomingRequest` from `index.tsx` → `MapViewComponent` as a prop.
- Render a distinct request/pickup marker at `incomingRequest.origin`. Do **not** add it to `scheduledPickups` / waypoints → the blue route is unchanged.
- Optionally a subtle dashed hint line from `ownLocation` → request origin (drawn separately, not part of the route) — kept minimal.

## 5. Passenger live location + distance to driver (Backend + RiderApp)
**Backend:**
- **`src/socket/broadcastLocation.ts`**: add `broadcastPassengerLocationToDrivers(io, passengerId, currentLocation)` — find active trips (`scheduled`/`in_progress`) where `passengerId == passengerId`, and emit `passenger-location-updated` `{ passengerId, currentLocation }` to each distinct driver via `connectedUsers.get(driverId)`.
- **`src/socket/handlers/locationHandler.ts`** (`update-location`): call the new function after storing `userLocations`. For a driver emitter it's a harmless no-op (no trips where the driver is a passenger).
- **`src/controllers/location/LocationController.ts`**: also call it on the REST passenger-location update so background sharing keeps pushing (mirrors the driver broadcast which is called from both paths).

**RiderApp:**
- **`hooks/driver/useDriverSocketEvents.ts`**: listen `passenger-location-updated` → `onPassengerLocation({ passengerId, currentLocation })`.
- **`hooks/driver/useDriverDashboard.ts`**: add `passengerLocations: { [passengerId]: coords }` state, updated by the socket callback.
- **`components/driver/ActiveTripsList.tsx`**: prefer the live passenger location for the distance label ("Pickup X km away" / "Drop X km away"), falling back to `origin`/`destination`.
- **`components/map/MapViewComponent.tsx`**: render a passenger marker at the live location for `in_progress` trips (keeping the scheduled pickup marker at `origin`).

---

## Files touched
- Backend: `socket/broadcastLocation.ts`, `socket/handlers/locationHandler.ts`, `controllers/location/LocationController.ts`
- RiderApp: `components/map/MapViewComponent.tsx`, `hooks/driver/useDriverDashboard.ts`, `hooks/driver/useDriverSocketEvents.ts`, `components/driver/ActiveTripsList.tsx`, `app/(tabs)/index.tsx`, + NEW `services/directions.ts`, `hooks/driver/useDriveMode.ts`, `components/driver/DriveModeBanner.tsx`
- UserApp: `components/map/MapViewComponent.tsx`

## Verification
- `npx tsc --noEmit` in Backend, RiderApp, UserApp.
- Manually: driver sets destination → drive mode banner appears; a passenger request shows a map marker keyed off `incomingRequest`; ActiveTripsList distance reflects passenger's live coords; GPS button centers on the moving driver/vehicle.
