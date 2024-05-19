import UniformSizeDBHandler from "@/actions/dbHandlers/UniformSizeDBHandler";
import { Card, CardBody } from "@/components/card";
import { prisma } from "@/lib/db";
import { t } from "@/lib/test";
import { Col, Row } from "react-bootstrap";
import UniformsizeConfigurationHeader from "./header";
import SizeItem from "./sizeItem";

export const dynamic = 'auto';

export default async function UniformsizeConfigurationPage({ params }: { params: { acronym: string } }) {
    const dbHandler = new UniformSizeDBHandler();
    const assosiation = await prisma.assosiation.findFirstOrThrow({ where: { acronym: params.acronym } });
    const sizes = await dbHandler.getAllUniformSizesByAssosiation(assosiation.id);

    const quad = Math.round((sizes.length / 4) + 0.25);
    const half = Math.round((sizes.length / 2));
    const thirdquad = Math.round(sizes.length / 4 * 3);
    const all = Math.round(sizes.length);

    const arrayList = [
        sizes.slice(0, quad),
        sizes.slice(quad, half),
        sizes.slice(half, thirdquad),
        sizes.slice(thirdquad, all)
    ];

    return (
        <div className="container-lg content-center bg-light rounded">
            <h1 className="text-center">
                {t('title.admin.size')}
            </h1>
            <Row className="justify-content-center">
                <Col xs={11} sm={12} md={10} lg={8} xl={12} >
                    <Card>
                        <UniformsizeConfigurationHeader
                            sizes={sizes} />
                        <CardBody>
                            <Row>
                                <Col xs={12} sm={6}>
                                    <Row>
                                        <Col xs={12} xl={6}>
                                            {arrayList[0].map((size, index) =>
                                                <SizeItem
                                                    key={size.id}
                                                    size={size}
                                                    index={index}
                                                    upDisabled={index == 0}
                                                    downDisabled={false} />
                                            )}
                                        </Col>
                                        <Col xs={12} xl={6}>
                                            {arrayList[1].map((size, index) =>
                                                <SizeItem
                                                    key={size.id}
                                                    size={size}
                                                    index={index}
                                                    upDisabled={false}
                                                    downDisabled={false} />
                                            )}
                                        </Col>
                                    </Row>
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Row>
                                        <Col xs={12} xl={6}>
                                            {arrayList[2].map((size, index) =>
                                                <SizeItem
                                                    key={size.id}
                                                    size={size}
                                                    index={index}
                                                    upDisabled={false}
                                                    downDisabled={false} />
                                            )}
                                        </Col>
                                        <Col xs={12} xl={6}>
                                            {arrayList[3].map((size, index) =>
                                                <SizeItem
                                                    key={size.id}
                                                    size={size}
                                                    index={index}
                                                    upDisabled={false}
                                                    downDisabled={(arrayList[3].length === (index + 1))} />
                                            )}
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}