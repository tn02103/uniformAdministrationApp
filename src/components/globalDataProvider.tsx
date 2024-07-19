"use client";
import { AuthRole } from "@/lib/AuthRoles";
import { InspectionStatus } from "@/types/deficiencyTypes";
import { UniformSizelist, UniformType } from "@/types/globalUniformTypes";
import { Context, createContext, useCallback, useContext } from "react";
import { SWRConfig } from "swr";



type GlobalDataProviderContextType = {
    userRole: AuthRole;
    useBeta: boolean;
    sizelists: UniformSizelist[]
}

type GlobalDataProviderPropType = {
    children: React.ReactNode;
    typeList: UniformType[];
    userRole: AuthRole;
    useBeta: boolean;
    sizelists: UniformSizelist[];
    inspectionState: InspectionStatus;
}

export let GlobalDataContext: Context<GlobalDataProviderContextType>;
export const useGlobalData = () => useContext(GlobalDataContext);

const GlobalDataProvider = ({ children, ...props }: GlobalDataProviderPropType) => {

    const getProviderContext = useCallback(() => {
        return {
            userRole: props.userRole,
            useBeta: props.useBeta,

            sizelists: props.sizelists,
        }
    }, [props.userRole]);

    GlobalDataContext = createContext<GlobalDataProviderContextType>(getProviderContext());
    return (
        <SWRConfig value={{
            fallback: {
                "uniform.type.list": props.typeList,
                "uniform.sizelist.list": props.sizelists,
                "inspection.status": props.inspectionState,
            }
        }}>
            <GlobalDataContext.Provider value={getProviderContext()}>
                {children}
            </GlobalDataContext.Provider>
        </SWRConfig>
    )
}

export default GlobalDataProvider;