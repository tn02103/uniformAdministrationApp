"use client";
import { getInspectionState } from "@/actions/inspection/status";
import { getUniformTypeConfiguration as getUniformTypeConfigurationSA } from "@/actions/uniform/type"
import { AuthRole } from "@/lib/AuthRoles"
import { InspectionStatus } from "@/types/deficiencyTypes";
import { UniformSizeList, UniformType } from "@/types/globalUniformTypes"
import { Context, createContext, useCallback, useContext } from "react"
import useSWR from "swr"



type GlobalDataProviderContextType = {
    uniformTypeConfiguration: UniformType[];
    userRole: AuthRole;
    inspectionState: InspectionStatus;
    useBeta: boolean;
    sizeLists: UniformSizeList[]
}

type GlobalDataProviderPropType = {
    children: React.ReactNode,
    uniformTypeConfiguration: UniformType[];
    userRole: AuthRole;
    useBeta: boolean;
    sizeLists: UniformSizeList[];
}

export let GlobalDataContext: Context<GlobalDataProviderContextType>;
export const useGlobalData = () => useContext(GlobalDataContext);

const GlobalDataProvider = ({ children, ...props }: GlobalDataProviderPropType) => {
    const { data: uniformTypeConfiguration } = useSWR(
        "uniformConfiguration",
        () => getUniformTypeConfigurationSA(),
        {
            fallbackData: props.uniformTypeConfiguration
        }
    )

    const initialInspectionState: InspectionStatus = { active: false }
    const { data: inspectionState } = useSWR(
        "inspection/status",
        () => getInspectionState(),
        {
            fallbackData: initialInspectionState,
            refreshInterval: 30
        }
    )

    const getProviderContext = useCallback(() => {
        return {
            uniformTypeConfiguration,
            userRole: props.userRole,
            useBeta: props.useBeta,
            inspectionState,
            sizeLists: props.sizeLists,
        }
    }, [uniformTypeConfiguration, props.userRole, inspectionState])

    GlobalDataContext = createContext<GlobalDataProviderContextType>(getProviderContext());
    return (
        <GlobalDataContext.Provider value={getProviderContext()}>
            {children}
        </GlobalDataContext.Provider>
    )
}

export default GlobalDataProvider;