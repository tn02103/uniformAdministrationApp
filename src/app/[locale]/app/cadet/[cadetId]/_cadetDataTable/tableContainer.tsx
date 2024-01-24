
import { getCadetData } from "@/actions/cadet/data"
import CadetDataTableForm from "./table";


type PropType = {
    params: { cadetId: string }
}
const CadetDataTable = async (props: PropType) => {

    let cadetData;
    if (props.params.cadetId !== "new")
        cadetData = await getCadetData(props.params.cadetId);


    return (
        <CadetDataTableForm initialData={cadetData} />
    )
}

export default CadetDataTable;
