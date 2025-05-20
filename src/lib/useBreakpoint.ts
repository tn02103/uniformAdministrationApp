import debounce from 'debounce';
import { useEffect, useState } from "react";

export const BreakpointMap = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
}
export type Breakpoint = keyof typeof BreakpointMap;
export type UseBreakpointModes = "gte" | "gt" | "lte" | "lt" | "eq";

const getCurrentBreakpoint = (size: number): Breakpoint => {
    if (size < BreakpointMap.sm) return "xs";
    if (size < BreakpointMap.md) return "sm";
    if (size < BreakpointMap.lg) return "md";
    if (size < BreakpointMap.xl) return "lg";
    if (size < BreakpointMap.xxl) return "xl";
    return "xxl";
}
const getNextBreakpoint = (size: number): Breakpoint | null => {
    if (size < BreakpointMap.sm) return "sm";
    if (size < BreakpointMap.md) return "md";
    if (size < BreakpointMap.lg) return "lg";
    if (size < BreakpointMap.xl) return "xl";
    if (size < BreakpointMap.xxl) return "xxl";
    return null;
}
const isMatchingRule = (size: number, breakpoint: Breakpoint, mode: UseBreakpointModes) => {
    const breakpointValue = BreakpointMap[breakpoint];
    const nextBreakpoint = getNextBreakpoint(breakpointValue);
    const nextBreakpointValue = nextBreakpoint ? BreakpointMap[nextBreakpoint] : Infinity;

    switch (mode) {
        case "gte":
            return size >= breakpointValue;
        case "gt":
            return size >= nextBreakpointValue;
        case "lte":
            return size < nextBreakpointValue;
        case "lt":
            return size < breakpointValue;
        case "eq":
            return (size >= breakpointValue && size < nextBreakpointValue);
    }
}

export const useBreakpoint = (breakpoint: keyof typeof BreakpointMap, mode: UseBreakpointModes = "gte") => {
    const [size, setSize] = useState<Breakpoint>(getCurrentBreakpoint(window.innerWidth));
    const [matchingBreakpoint, setMatchingBreakpoint] = useState<boolean>(isMatchingRule(window.innerWidth, breakpoint, mode));

    useEffect(() => {
        const calcInnerWidth = debounce(function () {
            setSize(getCurrentBreakpoint(window.innerWidth));
            setMatchingBreakpoint(isMatchingRule(window.innerWidth, breakpoint, mode));
        }, 100);

        window.addEventListener('resize', calcInnerWidth);
        return () => window.removeEventListener('resize', calcInnerWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { size, match: matchingBreakpoint };
}
