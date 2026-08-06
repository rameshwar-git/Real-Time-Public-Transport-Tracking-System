import { useCallback, useEffect, useRef, useState } from "react";
import { fetchDirections, DirectionsStep } from "@/services/directions";
import { getDistance } from "@/utils/geometry";

interface UseDriveModeArgs {
    /** Driver's live location (or the one-time GPS origin). */
    origin: any;
    destination: any;
    isOnDuty: boolean;
    /** True when there is at least one in-progress trip (actively driving a passenger). */
    hasActiveInProgressTrip: boolean;
}

const STEP_ADVANCE_KM = 0.04; // ~40 m from a maneuver point triggers the next step

/**
 * Lightweight turn-by-turn "drive mode" built on the Google Directions API.
 *
 * Drive mode is considered "on" when a destination is set and the driver is on duty. It shows
 * live navigation automatically while an in-progress passenger trip is running, and otherwise
 * waits for the driver to tap "Start navigation" (e.g. when cruising to their own destination).
 */
export function useDriveMode({
    origin,
    destination,
    isOnDuty,
    hasActiveInProgressTrip,
}: UseDriveModeArgs) {
    const [isNavigating, setIsNavigating] = useState(false);
    const [steps, setSteps] = useState<DirectionsStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [remainingDistanceText, setRemainingDistanceText] = useState("");
    const [remainingDurationText, setRemainingDurationText] = useState("");

    // A destination is set and the driver is online → drive mode is available.
    const isAvailable = !!isOnDuty && !!origin && !!destination;

    // Active when the driver started it OR they're mid-trip with a passenger on board.
    const isDriveActive = isAvailable && (isNavigating || hasActiveInProgressTrip);

    // Keep the latest origin in a ref so the step-advance effect doesn't re-fetch by re-running.
    const originRef = useRef(origin);
    originRef.current = origin;

    const loadSteps = useCallback(async () => {
        const o = originRef.current;
        if (!o || !destination) return;
        const result = await fetchDirections(o, destination);
        if (result && result.steps.length) {
            setSteps(result.steps);
            setCurrentStepIndex(0);
            setRemainingDistanceText(result.distanceText);
            setRemainingDurationText(result.durationText);
        }
    }, [destination]);

    // Fetch steps when drive mode becomes active; refresh periodically so the ETA stays current.
    useEffect(() => {
        if (!isDriveActive) return;
        loadSteps();
        const id = setInterval(loadSteps, 30000);
        return () => clearInterval(id);
    }, [isDriveActive, loadSteps]);

    // Advance to the next step once the driver crosses the current step's end point.
    useEffect(() => {
        const o = origin;
        if (!o || steps.length === 0 || currentStepIndex >= steps.length - 1) return;
        const stepEnd = steps[currentStepIndex].endLocation;
        if (!stepEnd || typeof stepEnd.latitude !== 'number' || typeof stepEnd.longitude !== 'number') return;
        const d = getDistance(o.latitude, o.longitude, stepEnd.latitude, stepEnd.longitude);
        if (d <= STEP_ADVANCE_KM) {
            setCurrentStepIndex(i => Math.min(steps.length - 1, i + 1));
        }
    }, [origin?.latitude, origin?.longitude, steps, currentStepIndex]);

    const currentStep: DirectionsStep | null = steps[currentStepIndex] || null;

    // Meters remaining until the next maneuver (via straight-line Haversine).
    const distanceToNext =
        currentStep && currentStep.endLocation && origin &&
        typeof currentStep.endLocation.latitude === 'number' &&
        typeof currentStep.endLocation.longitude === 'number'
            ? Math.round(
                  getDistance(origin.latitude, origin.longitude, currentStep.endLocation.latitude, currentStep.endLocation.longitude) * 1000
              )
            : 0;

    const startNavigation = useCallback(() => {
        setIsNavigating(true);
        loadSteps();
    }, [loadSteps]);

    const stopNavigation = useCallback(() => setIsNavigating(false), []);

    return {
        isAvailable,
        isDriveActive,
        currentStep,
        distanceToNext,
        remainingDistanceText,
        remainingDurationText,
        startNavigation,
        stopNavigation,
    };
}
