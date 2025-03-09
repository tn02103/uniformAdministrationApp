import { StorageUnitWithUniformItems } from "@/dal/storageUnit/_index";
import { Col, Form, Row, Table } from "react-bootstrap";

type Props = {
    storageUnit: StorageUnitWithUniformItems
}
export default function UnitsliderUniformList({ storageUnit }: Props) {

    return (
        <div>
            <h5 className="text-center">Uniformitems</h5>
            <Table hover>
                <thead>
                    <tr className="border-bottom border-dark">
                        <th></th>
                        <th>Typ</th>
                        <th>Größe</th>
                        <th>Generation</th>
                    </tr>
                </thead>
                <tbody>
                    {storageUnit.uniformList.map((uniform) => (
                        <tr key={uniform.id} className="">
                            <td><Form.Check /></td>
                            <td>{uniform.type.name}-{uniform.number}</td>
                            <td>{uniform.size?.name}</td>
                            <td>{uniform.generation?.name}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
}