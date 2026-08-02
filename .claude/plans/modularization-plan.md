# Modularize & Optimize Across All Three Codebases

**Goals:** Remove duplication, make the code more modular, and clean up — **without changing any runtime behavior or business logic**. Conservative depth. Phased so the risky React Native change happens last and is isolated.

**Scope decisions (from user):**
- RN apps (RiderApp, UserApp): **shared-package extraction**, done **last** after the backend is confirmed good.
- Refactor depth: **conservative** (extract duplicated helpers, replace inline `require()` with imports, reusable wrappers, dead-code removal — all behavior-preserving).

---

## Phase 1 — Backend refactor (safe, do first, verify)

`Backend/src` (~35 files, 2,375 lines). All changes behavior-preserving.

1. **Replace inline `require()` with static imports** in socket handlers
   - `socket/handlers/rideHandler.ts` (lines ~16,106,114,131,136,140,165), `tripHandler.ts`, `locationHandler.ts`, `disconnectHandler.ts` — replace `require(...)` calls with the same imports already established in `connectionManager.ts`.
2. **Extract shared seat helpers** (repeat of `currentSeats = v.availableSeats ?? v.capacity; findByIdAndUpdate(...±1)`):
   - `socket/utils/seats.ts` with `getSeats()`, `takeSeat()`, `restoreSeat()`.
   - Rewire `rideHandler.ts:117-120`, `tripHandler.ts:53-56,81-84`, `locationHandler.ts:66-69`, `disconnectHandler.ts:59-62` to use them. Same math.
3. **Extract `fareFor(trip)` helper** → `utils/fareCalculator.ts` — collapses the `fare !== undefined ? fare : calculateFare(...)` ternary repeated ~9× in `DriverController.ts` (140,141,147,203,288,324,352,378,390) and `PassengerController.ts` (198,237,358). Same expression.
4. **Extract one `completeTripAndRestoreSeat()` + notify-passenger helper** shared by `tripHandler.ts:45-59`, `locationHandler.ts:59-84`, `disconnectHandler.ts:51-66`. Behavior-preserving (same status set, seat restore, passenger emit).
5. **Add `asyncHandler` + normalize error responses** across controllers — replace ~40 repetitive `try/catch → res.status(500).json({error: err.message})` blocks with a small wrapper that preserves the exact current error shape/status per site (verify each before wrapping; do not change messages).
6. **Consolidate `putTripPassenger`/`putTripDriver` + rating validation** in `TripController.ts` (17-42, 145-151 vs 173-179) into a single parameterized function.
7. **Collapse duplicate dist/fare-estimation** in `rideHandler.ts` (26-32,35-64 vs 144-162) into one helper that calls `calculateFare(dist, vehicleType)` — keeping the existing `*2.4` distance factor. Verify math matches current on-disk code (recently modified file — re-check before/after).
8. **Fix `Trip` interface** (`models/interfaces/tripModel.ts`) to include `fare`/`estimatedDistance`/`estimatedDuration`/`otp` — removes `(trip as any)` casts in `DriverController.ts` (288-324 etc.).
9. **Remove dead code**: delete empty, unmounted `routes/vehicles/VehiclesRoutes.ts`; fix `VehicleController.ts:5-12` error path that doesn't `return` (double-response risk) — return the value to match controller contract.

**Verify:** `cd Backend && npx tsc --noEmit` passes; confirm no exported symbol used elsewhere is removed.

> ⚠️ `git status` shows these were recently modified: `TripController.ts`, `DriverController.ts`, `TripModel.ts`, `TripRoutes.ts`, `rideHandler.ts` — re-verify current disk content before/after each edit in those files.

---

## Phase 2 — In-app conservative cleanup (RiderApp + UserApp)

After Phase 1 is confirmed, do low-risk cleanup **within** each app. No cross-app moves yet.

- Remove unused imports / unused files flagged by `tsc --noEmit` and `expo lint` (e.g. `@react-native-picker/picker`, `react-navigation` may be unused — verify).
- Fix the broken `@services/*` → `./servces` typo in both `tsconfig.json` path aliases (or remove if unused).
- No behavioral change; run `npx tsc --noEmit` in each app to confirm.

*(Phase 2 is light so most of the shared-package phase does the heavy lifting — see Phase 3.)*

---

## Phase 3 — RN shared-package extraction (LAST — isolated risk)

Because both apps are non-workspace Expo apps (each has its own `node_modules`, no root package.json), extracting shared code requires a small Metro config change — the one piece that can break the build. Done last and verified first.

1. **Create `RealTime/shared/`** — top-level, not under `packages/`.
2. **Move the ~24 byte-identical files** preserving folder structure:
   - `utils/` (authFetch, authServices, geometry, tokenStorage)
   - `types/` (map, status) · `datatypes/` (responsetype, userdata) · `constants/theme.ts`
   - `hooks/` (getPlaceDetails, use-color-scheme, use-color-scheme.web, use-theme-color)
   - `services/storageService.ts` · `modules/auth.ts`
   - `components/` (button, external-link, haptic-tab, parallax-scroll-view, themed-text, themed-view, ui/icon-symbol, ui/textinput, map/CenterPin)
3. **Parameterize the ~9 near-identical files** into shared versions driven by a per-app theme/config prop (currently differ only by color: emerald vs blue, poll 3s vs 10s):
   - `constants/ui.ts`, `services/apiService.ts`, `services/locationServices.ts`, `services/socket.ts`, `hooks/auth/auth.ts`, `hooks/location/getPlacePredictions.ts`, `useLocationSharing.ts`, `useLiveLocations.ts`, `components/ui/LocationSearchInput.tsx`, `map/DestinationMarker.tsx`, `map/DriverMarker.tsx`
4. **Rewire both apps**:
   - Add `"@shared/*": ["../../shared/*"]` to both `tsconfig.json` `paths`.
   - Add a small `metro.config.js` to each app: `getDefaultConfig` + `watchFolders: [path.resolve(__dirname, '../shared')]`. **Leave `babel.config.js` untouched** (no module-resolver — biggest build-break source avoided).
   - Rewrite every `@/…` reference to a moved file as `@shared/…` (~70 sites per app, mechanical).
5. **Keep per-app** (do NOT move): all `app/` routes, `components/driver/*`, `components/ride/*`, `hooks/driver/*`, `hooks/ride/*`, `map/MapViewComponent.tsx` (app-specific), assets (differ per app).

**Verify (before anything else in this phase):**
- `npx tsc --noEmit` in both apps.
- Clean bundle check: `npx expo export` (or start Metro) right after the network change to confirm `watchFolders` resolves. If Metro fails, roll back just the `metro.config.js` / `@shared` change — isolated to this phase.

---

## Definition of done
- Backend: `tsc --noEmit` clean, all moves behavior-preserving, dead code removed.
- Both RN apps: `tsc --noEmit` clean, shared files consolidated into `shared/`, app-specific code untouched.
- No business logic changed anywhere — only structure/duplication.
