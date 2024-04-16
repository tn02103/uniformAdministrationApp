"use client";
import { getUniformTypeList } from "@/actions/controllers/UniformConfigController";
import { getInspectionState } from "@/actions/inspection/status";
import { useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { AuthRole } from "@/lib/AuthRoles";
import { InspectionStatus } from "@/types/deficiencyTypes";
import { UniformSizeList, UniformType } from "@/types/globalUniformTypes";
import { Context, createContext, useCallback, useContext } from "react";
import useSWR from "swr";



type GlobalDataProviderContextType = {
    typeList: UniformType[];
    userRole: AuthRole;
    inspectionState: InspectionStatus;
    useBeta: boolean;
    sizeLists: UniformSizeList[]
}

type GlobalDataProviderPropType = {
    children: React.ReactNode;
    typeList: UniformType[];
    userRole: AuthRole;
    useBeta: boolean;
    sizeLists: UniformSizeList[];
}

export let GlobalDataContext: Context<GlobalDataProviderContextType>;
export const useGlobalData = () => useContext(GlobalDataContext);

const GlobalDataProvider = ({ children, ...props }: GlobalDataProviderPropType) => {
    const { data: typeList } = useSWR(
        'uniform.type.list23',
        getUniformTypeList,
        {
            fallbackData: props.typeList
        });

    const initialInspectionState: InspectionStatus = { active: false }
    const { data: inspectionState } = useSWR(
        "inspection/status",
        () => getInspectionState("Global Data"),
        {
            fallbackData: initialInspectionState,
            refreshInterval: 3000
        }
    );

    const getProviderContext = useCallback(() => {
        return {
            typeList: typeList!,
            userRole: props.userRole,
            useBeta: props.useBeta,
            inspectionState,
            sizeLists: props.sizeLists,
        }
    }, [typeList, props.userRole, inspectionState]);

    GlobalDataContext = createContext<GlobalDataProviderContextType>(getProviderContext());
    return (
        <GlobalDataContext.Provider value={getProviderContext()}>
            {children}
        </GlobalDataContext.Provider>
    )
}

export default GlobalDataProvider;