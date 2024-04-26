"use client";
import { AuthRole } from "@/lib/AuthRoles";
import { InspectionStatus } from "@/types/deficiencyTypes";
import { UniformSizeList, UniformType } from "@/types/globalUniformTypes";
import { Context, createContext, useCallback, useContext } from "react";
import { SWRConfig } from "swr";



type GlobalDataProviderContextType = {
    userRole: AuthRole;
    useBeta: boolean;
    sizeLists: UniformSizeList[]
}

type GlobalDataProviderPropType = {
    children: React.ReactNode;
    typeList: UniformType[];
    userRole: AuthRole;
    useBeta: boolean;
    sizeLists: UniformSizeList[];
    inspectionState: InspectionStatus;
}

export let GlobalDataContext: Context<GlobalDataProviderContextType>;
export const useGlobalData = () => useContext(GlobalDataContext);

const GlobalDataProvider = ({ children, ...props }: GlobalDataProviderPropType) => {

    const getProviderContext = useCallback(() => {
        return {
            userRole: props.userRole,
            useBeta: props.useBeta,

            sizeLists: props.sizeLists,
        }
    }, [props.userRole]);

    GlobalDataContext = createContext<GlobalDataProviderContextType>(getProviderContext());
    return (
        <SWRConfig value={{
            fallback: {
                "uniform.type.list": props.typeList,
                "uniform.sizeList.list": props.sizeLists,
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