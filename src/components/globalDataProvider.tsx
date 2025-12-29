"use client";
import { AuthRole } from "@/lib/AuthRoles";
import { InspectionStatus } from "@/types/deficiencyTypes";
import { UniformSizelist, UniformType } from "@/types/globalUniformTypes";
import { Context, createContext, useCallback, useContext } from "react";
import { SWRConfig } from "swr";



type GlobalDataProviderContextType = {
    userRole: AuthRole;
    useBeta: boolean;
    sizelists: UniformSizelist[],
    typeList: UniformType[],
}

type GlobalDataProviderPropType = {
    children: React.ReactNode;
    typeList: UniformType[];
    userRole: AuthRole;
    useBeta: boolean;
    sizelists: UniformSizelist[];
    inspectionState: InspectionStatus | null;
}

export let GlobalDataContext: Context<GlobalDataProviderContextType>;
export const useGlobalData = () => useContext(GlobalDataContext);

const GlobalDataProvider = ({ children, userRole, useBeta, sizelists, typeList, inspectionState }: GlobalDataProviderPropType) => {

    const getProviderContext = useCallback(() => {
        return {
            userRole: userRole,
            useBeta: useBeta,
            sizelists: sizelists,
            typeList: typeList,
        }
    }, [sizelists, useBeta, userRole, typeList]);

    GlobalDataContext = createContext<GlobalDataProviderContextType>(getProviderContext());
    return (
        <SWRConfig value={{
            fallback: {
                "uniform.type.list": typeList,
                "uniform.sizelist.list": sizelists,
                "inspection.status": inspectionState,
            }
        }}>
            <GlobalDataContext.Provider value={getProviderContext()}>
                {children}
            </GlobalDataContext.Provider>
        </SWRConfig>
    )
}

export default GlobalDataProvider;