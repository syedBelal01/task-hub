import { useState, useEffect } from "react";

/**
 * Delays the true state of a loading flag to prevent 
 * flickering empty skeletons on extremely fast network responses.
 * @param loading - The original boolean loading state
 * @param delayMs - The amount of milliseconds to wait before switching to true
 */
export function useDelayedLoading(loading: boolean, delayMs = 250) {
    const [showLoading, setShowLoading] = useState(false);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (loading) {
            timeout = setTimeout(() => {
                setShowLoading(true);
            }, delayMs);
        } else {
            setShowLoading(false);
        }
        return () => clearTimeout(timeout);
    }, [loading, delayMs]);

    return showLoading;
}
