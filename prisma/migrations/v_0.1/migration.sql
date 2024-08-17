-- CREATE SHEMA
CREATE SCHEMA IF NOT EXISTS authentication;
ALTER SCHEMA authentication OWNER TO "uniformServer";
CREATE SCHEMA IF NOT EXISTS base;
ALTER SCHEMA base OWNER TO "uniformServer";
CREATE SCHEMA IF NOT EXISTS inspection;
ALTER SCHEMA inspection OWNER TO "uniformServer";
-- CREATE TYPES
CREATE TYPE inspection.deficiencytype_dependent AS ENUM ('cadet', 'uniform');
ALTER TYPE inspection.deficiencytype_dependent OWNER TO "uniformServer";
CREATE TYPE inspection.deficiencytype_relation AS ENUM ('uniform', 'material');
ALTER TYPE inspection.deficiencytype_relation OWNER TO "uniformServer";
-- CREATE TABLES
--
-- TOC entry 218 (class 1259 OID 21219)
-- Name: assosiation; Type: TABLE; Schema: authentication; Owner: uniformServer
--
CREATE TABLE authentication.assosiation (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    acronym character varying(5) NOT NULL,
    use_beta boolean DEFAULT false NOT NULL
);
ALTER TABLE authentication.assosiation OWNER TO "uniformServer";
INSERT INTO authentication.assosiation
SELECT id,
    name,
    acronym,
    "useBeta"
FROM public."Assosiation";
--
-- TOC entry 219 (class 1259 OID 21226)
-- Name: refresh_token; Type: TABLE; Schema: authentication; Owner: uniformServer
--
CREATE TABLE authentication.refresh_token (
    fk_user character(36) NOT NULL,
    token character(50) NOT NULL,
    end_of_live timestamp(6) without time zone NOT NULL,
    device_id character(36) NOT NULL
);
ALTER TABLE authentication.refresh_token OWNER TO "uniformServer";
--
-- TOC entry 220 (class 1259 OID 21231)
-- Name: user; Type: TABLE; Schema: authentication; Owner: uniformServer
--
CREATE TABLE authentication."user" (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    fk_assosiation character(36) NOT NULL,
    username character varying(10) NOT NULL,
    name character varying(20) NOT NULL,
    password character varying(100) NOT NULL,
    role smallint NOT NULL,
    active boolean NOT NULL,
    failed_login_count integer DEFAULT 0 NOT NULL
);
ALTER TABLE authentication."user" OWNER TO "uniformServer";
INSERT INTO authentication."user"
SELECT id,
    fk_assosiation,
    username,
    name,
    password,
    role,
    active,
    "failedLoginCount"
FROM public."User";
--
-- TOC entry 237 (class 1259 OID 21349)
-- Name: _uniformsizetouniformsizelist; Type: TABLE; Schema: base; Owner: uniformServer
--
CREATE TABLE base._uniformsizetouniformsizelist (
    "A" character(36) NOT NULL,
    "B" character(36) NOT NULL
);
ALTER TABLE base._uniformsizetouniformsizelist OWNER TO "uniformServer";
INSERT INTO base._uniformsizetouniformsizelist
SELECT "A",
    "B"
FROM public."_uniformsizetouniformsizelist";
--
-- TOC entry 221 (class 1259 OID 21238)
-- Name: cadet; Type: TABLE; Schema: base; Owner: uniformServer
--
CREATE TABLE base.cadet (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    fk_assosiation character(36) NOT NULL,
    firstname character varying(30) NOT NULL,
    lastname character varying(30) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    comment text DEFAULT ''::text NOT NULL,
    recdelete timestamp(6) without time zone,
    recdelete_user character varying(10)
);
ALTER TABLE base.cadet OWNER TO "uniformServer";
INSERT INTO base.cadet
SELECT id,
    fk_assosiation,
    firstname,
    lastname,
    active,
    comment,
    recdelete,
    "recdeleteUser"
FROM public."Cadet";
--
-- TOC entry 229 (class 1259 OID 21296)
-- Name: material; Type: TABLE; Schema: base; Owner: uniformServer
--
CREATE TABLE base.material (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    typename character varying(20) NOT NULL,
    fk_material_group character(36) NOT NULL,
    quantity_actual smallint NOT NULL,
    quantity_target smallint NOT NULL,
    sort_order smallint NOT NULL,
    recdelete timestamp(6) without time zone,
    recdelete_user character varying(10)
);
ALTER TABLE base.material OWNER TO "uniformServer";
INSERT INTO base.material
SELECT id,
    typename,
    "fk_materialGroup",
    "actualQuantity",
    "targetQuantity",
    "sortOrder",
    "recdelete",
    "recdeleteUser"
FROM public."Material";
--
-- TOC entry 228 (class 1259 OID 21290)
-- Name: material_group; Type: TABLE; Schema: base; Owner: uniformServer
--
CREATE TABLE base.material_group (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    fk_assosiation character(36) NOT NULL,
    description character varying(20) NOT NULL,
    issued_default smallint,
    sort_order smallint NOT NULL,
    recdelete timestamp(6) without time zone,
    recdelete_user character varying(10),
    multitype_allowed boolean NOT NULL
);
ALTER TABLE base.material_group OWNER TO "uniformServer";
INSERT INTO base.material_group
SELECT id,
    fk_assosiation,
    description,
    "issuedDefault",
    "sortOrder",
    recdelete,
    "recdeleteUser",
    "multitypeAllowed"
FROM public."MaterialGroup";
--
-- TOC entry 230 (class 1259 OID 21302)
-- Name: material_issued; Type: TABLE; Schema: base; Owner: uniformServer
--
CREATE TABLE base.material_issued (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    fk_material character(36) NOT NULL,
    fk_cadet character(36) NOT NULL,
    quantity smallint NOT NULL,
    date_issued timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_returned timestamp(6) without time zone
);
ALTER TABLE base.material_issued OWNER TO "uniformServer";
INSERT INTO base.material_issued
SELECT id,
    fk_material,
    fk_cadet,
    quantity,
    "dateIssued",
    "dateReturned"
FROM public."MaterialIssued";
--
-- TOC entry 226 (class 1259 OID 21274)
-- Name: uniform; Type: TABLE; Schema: base; Owner: uniformServer
--
CREATE TABLE base.uniform (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    number integer NOT NULL,
    fk_uniform_type character(36) NOT NULL,
    fk_generation character(36),
    fk_size character(36),
    active boolean DEFAULT true NOT NULL,
    comment text,
    recdelete timestamp(6) without time zone,
    recdelete_user character varying(10)
);
ALTER TABLE base.uniform OWNER TO "uniformServer";
INSERT INTO base.uniform
SELECT id,
    number,
    "fk_uniformType",
    "fk_generation",
    fk_size,
    active,
    comment,
    recdelete,
    "recdeleteUser"
FROM public."Uniform";
--
-- TOC entry 223 (class 1259 OID 21255)
-- Name: uniform_generation; Type: TABLE; Schema: base; Owner: uniformServer
--
CREATE TABLE base.uniform_generation (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    fk_uniform_type character(36) NOT NULL,
    name character varying(20) NOT NULL,
    fk_sizelist character(36),
    sort_order smallint NOT NULL,
    outdated boolean DEFAULT false NOT NULL,
    recdelete timestamp(6) without time zone,
    recdelete_user character varying(10)
);
ALTER TABLE base.uniform_generation OWNER TO "uniformServer";
INSERT INTO base.uniform_generation
SELECT id,
    "fk_uniformType",
    name,
    "fk_sizeList",
    "sortOrder",
    outdated,
    recdelete,
    "recdeleteUser"
FROM public."UniformGeneration";
--
-- TOC entry 227 (class 1259 OID 21283)
-- Name: uniform_issued; Type: TABLE; Schema: base; Owner: uniformServer
--
CREATE TABLE base.uniform_issued (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    fk_cadet character(36) NOT NULL,
    fk_uniform character(36) NOT NULL,
    date_issued date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_returned date
);
ALTER TABLE base.uniform_issued OWNER TO "uniformServer";
INSERT INTO base.uniform_issued
SELECT id,
    fk_cadet,
    fk_uniform,
    "dateIssued",
    "dateReturned"
FROM public."UniformIssued";
--
-- TOC entry 224 (class 1259 OID 21262)
-- Name: uniform_size; Type: TABLE; Schema: base; Owner: uniformServer
--
CREATE TABLE base.uniform_size (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    fk_assosiation character(36) NOT NULL,
    name character varying(10) NOT NULL,
    sort_order integer NOT NULL
);
ALTER TABLE base.uniform_size OWNER TO "uniformServer";
INSERT INTO base.uniform_size
SELECT id,
    fk_assosiation,
    name,
    "sortOrder"
FROM public."UniformSize";
--
-- TOC entry 225 (class 1259 OID 21268)
-- Name: uniform_sizelist; Type: TABLE; Schema: base; Owner: uniformServer
--
CREATE TABLE base.uniform_sizelist (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    fk_assosiation character(36) NOT NULL,
    name character varying(40) NOT NULL
);
ALTER TABLE base.uniform_sizelist OWNER TO "uniformServer";
INSERT INTO base.uniform_sizelist
SELECT id,
    fk_assosiation,
    name
FROM public."UniformSizelist";
--
-- TOC entry 222 (class 1259 OID 21248)
-- Name: uniform_type; Type: TABLE; Schema: base; Owner: uniformServer
--
CREATE TABLE base.uniform_type (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    fk_assosiation character(36) NOT NULL,
    acronym character varying(2) NOT NULL,
    name character varying(10) NOT NULL,
    issued_default integer DEFAULT 1 NOT NULL,
    using_generation boolean NOT NULL,
    using_size boolean NOT NULL,
    sort_order integer NOT NULL,
    recdelete timestamp(6) without time zone,
    recdelete_user character varying(10),
    fk_default_sizelist character(36)
);
ALTER TABLE base.uniform_type OWNER TO "uniformServer";
INSERT INTO base.uniform_type
SELECT id,
    fk_assosiation,
    acronym,
    name,
    "issuedDefault",
    "usingGenerations",
    "usingSizes",
    "sortOrder",
    recdelete,
    "recdeleteUser",
    "fk_defaultSizeList"
FROM public."UniformType";
--
-- TOC entry 233 (class 1259 OID 21323)
-- Name: deficiency_type; Type: TABLE; Schema: inspection; Owner: uniformServer
--
CREATE TABLE inspection.deficiency_type (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    fk_assosiation character(36) NOT NULL,
    name character varying(20) NOT NULL,
    dependent inspection.deficiencytype_dependent NOT NULL,
    relation inspection.deficiencytype_relation,
    disabled_date DATE,
    disabled_user VARCHAR(10)
);
ALTER TABLE inspection.deficiency_type OWNER TO "uniformServer";
INSERT INTO inspection.deficiency_type
SELECT cdt.id,
    cdt.fk_assosiation,
    cdt.name,
    CAST(
        CASE
            WHEN (cdt."addCommentToUniformitem" = TRUE) THEN 'uniform'
            ELSE 'cadet'
        END as inspection.deficiencytype_dependent
    ),
    CAST(
        CASE
            WHEN (cdt."addCommentToUniformitem" = TRUE) THEN NULL
            WHEN (cdt."dependsOnUniformitem" = TRUE) THEN 'uniform'
            ELSE NULL
        END as inspection.deficiencytype_relation
    ),
    NULL,
    NULL
FROM public."CadetDeficiencyType" cdt;
--
-- TOC entry 235 (class 1259 OID 21339)
-- Name: cadet_deficiency; Type: TABLE; Schema: inspection; Owner: uniformServer
--
CREATE TABLE inspection.cadet_deficiency (
    deficiency_id character(36) NOT NULL,
    fk_cadet character(36) NOT NULL,
    fk_uniform character(36),
    fk_material character(36)
);
ALTER TABLE inspection.cadet_deficiency OWNER TO "uniformServer";
INSERT INTO inspection.cadet_deficiency
SELECT d.id,
    ci.fk_cadet,
    CASE
        WHEN dt.relation = 'uniform' THEN (
            SELECT iu.id
            FROM public."Uniform" iu
                JOIN public."UniformType" iut ON iu."fk_uniformType" = iut.id
            WHERE iut.name = SPLIT_PART(d.description, '-', 1)
                AND iu.number = CAST(SPLIT_PART(d.description, '-', 2) as integer)
            LIMIT 1
        )
        ELSE Null
    END,
    NULL
FROM public."CadetDeficiency" d
    JOIN inspection.deficiency_type dt ON dt.id = d."fk_deficiencyType"
    JOIN public."CadetInspection" ci ON ci.id = d."fk_cadetInspection"
WHERE dt.dependent = 'cadet';
--
-- TOC entry 232 (class 1259 OID 21317)
-- Name: cadet_inspection; Type: TABLE; Schema: inspection; Owner: uniformServer
--
CREATE TABLE inspection.cadet_inspection (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    fk_inspection character(36) NOT NULL,
    fk_cadet character(36) NOT NULL,
    uniform_complete boolean NOT NULL,
    inspector character varying(10) NOT NULL
);
ALTER TABLE inspection.cadet_inspection OWNER TO "uniformServer";
INSERT INTO inspection.cadet_inspection
SELECT id,
    fk_inspection,
    fk_cadet,
    "uniformComplete",
    'xx'
FROM public."CadetInspection";
--
-- TOC entry 234 (class 1259 OID 21329)
-- Name: deficiency; Type: TABLE; Schema: inspection; Owner: uniformServer
--
CREATE TABLE inspection.deficiency (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    fk_deficiency_type character(36) NOT NULL,
    description character varying(30) NOT NULL,
    comment text NOT NULL,
    date_created date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_updated date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_resolved date,
    user_created character varying(10) NOT NULL,
    user_updated character varying(10) NOT NULL,
    user_resolved character varying(10),
    fk_inspection_created character(36),
    fk_inspection_resolved character(36)
);
ALTER TABLE inspection.deficiency OWNER TO "uniformServer";
INSERT INTO inspection.deficiency
SELECT cd.id,
    cd."fk_deficiencyType",
    cd.description,
    cd.comment,
    cd."dateCreated",
    cd."dateCreated",
    cd."dateResolved",
    'xx',
    'xx',
    CASE
        WHEN cd."dateResolved" IS NULL THEN NULL
        ELSE 'xx'
    END,
    ci."fk_inspection",
    (
        SELECT i.id
        FROM public."Inspection" i
        WHERE i.date = cd."dateResolved"
            AND i.fk_assosiation = cdt."fk_assosiation"
        LIMIT 1
    )
FROM public."CadetDeficiency" cd
    JOIN public."CadetDeficiencyType" cdt ON cdt.id = cd."fk_deficiencyType"
    JOIN public."CadetInspection" ci ON ci.id = cd."fk_cadetInspection";
--
-- TOC entry 231 (class 1259 OID 21309)
-- Name: inspection; Type: TABLE; Schema: inspection; Owner: uniformServer
--
CREATE TABLE inspection.inspection (
    id character(36) DEFAULT gen_random_uuid() NOT NULL,
    fk_assosiation character(36) NOT NULL,
    date date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    time_start timestamp(3) without time zone,
    time_end timestamp(3) without time zone,
    active boolean DEFAULT true NOT NULL
);
ALTER TABLE inspection.inspection OWNER TO "uniformServer";
INSERT INTO inspection.inspection
SELECT id,
    fk_assosiation,
    date,
    null,
    null,
    active
FROM public."Inspection";
--
-- TOC entry 236 (class 1259 OID 21344)
-- Name: uniform_deficiency; Type: TABLE; Schema: inspection; Owner: uniformServer
--
CREATE TABLE inspection.uniform_deficiency (
    deficiency_id character(36) NOT NULL,
    fk_uniform character(36) NOT NULL
);
ALTER TABLE inspection.uniform_deficiency OWNER TO "uniformServer";
INSERT INTO inspection.uniform_deficiency
SELECT d.id,
    (
        SELECT iu.id
        FROM public."Uniform" iu
            JOIN public."UniformType" iut ON iu."fk_uniformType" = iut.id
        WHERE iut.name = SPLIT_PART(d.description, '-', 1)
            AND iu.number = CAST(SPLIT_PART(d.description, '-', 2) as integer)
        LIMIT 1
    )
FROM public."CadetDeficiency" d
    JOIN inspection.deficiency_type dt ON dt.id = d."fk_deficiencyType"
WHERE dt.dependent = 'uniform';
--INDEXES
ALTER TABLE ONLY authentication.assosiation
ADD CONSTRAINT assosiation_pkey PRIMARY KEY (id);
ALTER TABLE ONLY authentication.refresh_token
ADD CONSTRAINT refresh_token_pkey PRIMARY KEY (token);
ALTER TABLE ONLY authentication."user"
ADD CONSTRAINT user_pkey PRIMARY KEY (id);
ALTER TABLE ONLY base.cadet
ADD CONSTRAINT cadet_pkey PRIMARY KEY (id);
ALTER TABLE ONLY base.material_group
ADD CONSTRAINT material_group_pkey PRIMARY KEY (id);
ALTER TABLE ONLY base.material_issued
ADD CONSTRAINT material_issued_pkey PRIMARY KEY (id);
ALTER TABLE ONLY base.material
ADD CONSTRAINT material_pkey PRIMARY KEY (id);
ALTER TABLE ONLY base.uniform_generation
ADD CONSTRAINT uniform_generation_pkey PRIMARY KEY (id);
ALTER TABLE ONLY base.uniform_issued
ADD CONSTRAINT uniform_issued_pkey PRIMARY KEY (id);
ALTER TABLE ONLY base.uniform
ADD CONSTRAINT uniform_pkey PRIMARY KEY (id);
ALTER TABLE ONLY base.uniform_size
ADD CONSTRAINT uniform_size_pkey PRIMARY KEY (id);
ALTER TABLE ONLY base.uniform_sizelist
ADD CONSTRAINT uniform_sizelist_pkey PRIMARY KEY (id);
ALTER TABLE ONLY base.uniform_type
ADD CONSTRAINT uniform_type_pkey PRIMARY KEY (id);
ALTER TABLE ONLY inspection.cadet_deficiency
ADD CONSTRAINT cadet_deficiency_pkey PRIMARY KEY (deficiency_id);
ALTER TABLE ONLY inspection.cadet_inspection
ADD CONSTRAINT cadet_inspection_pkey PRIMARY KEY (id);
ALTER TABLE ONLY inspection.deficiency
ADD CONSTRAINT deficiency_pkey PRIMARY KEY (id);
ALTER TABLE ONLY inspection.deficiency_type
ADD CONSTRAINT deficiency_type_pkey PRIMARY KEY (id);
ALTER TABLE ONLY inspection.inspection
ADD CONSTRAINT inspection_pkey PRIMARY KEY (id);
ALTER TABLE ONLY inspection.uniform_deficiency
ADD CONSTRAINT uniform_deficiency_pkey PRIMARY KEY (deficiency_id);
CREATE UNIQUE INDEX assosiation_name_key ON authentication.assosiation USING btree (name);
CREATE INDEX refresh_token_fk_user_idx ON authentication.refresh_token USING btree (fk_user);
CREATE INDEX user_fk_assosiation_idx ON authentication."user" USING btree (fk_assosiation);
CREATE UNIQUE INDEX user_username_fk_assosiation_key ON authentication."user" USING btree (username, fk_assosiation);
CREATE UNIQUE INDEX "_uniformsizetouniformsizelist_AB_unique" ON base._uniformsizetouniformsizelist USING btree ("A", "B");
CREATE INDEX "_uniformsizetouniformsizelist_B_index" ON base._uniformsizetouniformsizelist USING btree ("B");
CREATE INDEX cadet_fk_assosiation_idx ON base.cadet USING btree (fk_assosiation);
CREATE INDEX material_fk_material_group_idx ON base.material USING btree (fk_material_group);
CREATE INDEX material_group_fk_assosiation_idx ON base.material_group USING btree (fk_assosiation);
CREATE INDEX material_issued_fk_cadet_idx ON base.material_issued USING btree (fk_cadet);
CREATE UNIQUE INDEX material_issued_fk_material_fk_cadet_date_issued_key ON base.material_issued USING btree (fk_material, fk_cadet, date_issued);
CREATE INDEX uniform_fk_generation_idx ON base.uniform USING btree (fk_generation);
CREATE INDEX uniform_fk_size_idx ON base.uniform USING btree (fk_size);
CREATE INDEX uniform_fk_uniform_type_idx ON base.uniform USING btree (fk_uniform_type);
CREATE INDEX uniform_generation_fk_sizelist_idx ON base.uniform_generation USING btree (fk_sizelist);
CREATE INDEX uniform_generation_fk_uniform_type_idx ON base.uniform_generation USING btree (fk_uniform_type);
CREATE UNIQUE INDEX uniform_issued_fk_cadet_fk_uniform_date_issued_key ON base.uniform_issued USING btree (fk_cadet, fk_uniform, date_issued);
CREATE INDEX uniform_issued_fk_cadet_idx ON base.uniform_issued USING btree (fk_cadet);
CREATE INDEX uniform_issued_fk_uniform_idx ON base.uniform_issued USING btree (fk_uniform);
CREATE INDEX uniform_size_fk_assosiation_idx ON base.uniform_size USING btree (fk_assosiation);
CREATE UNIQUE INDEX uniform_size_name_fk_assosiation_key ON base.uniform_size USING btree (name, fk_assosiation);
CREATE INDEX uniform_sizelist_fk_assosiation_idx ON base.uniform_sizelist USING btree (fk_assosiation);
CREATE UNIQUE INDEX uniform_sizelist_name_fk_assosiation_key ON base.uniform_sizelist USING btree (name, fk_assosiation);
CREATE INDEX uniform_type_fk_assosiation_idx ON base.uniform_type USING btree (fk_assosiation);
CREATE INDEX uniform_type_fk_default_sizelist_idx ON base.uniform_type USING btree (fk_default_sizelist);
CREATE INDEX cadet_inspection_fk_cadet_idx ON inspection.cadet_inspection USING btree (fk_cadet);
CREATE UNIQUE INDEX cadet_inspection_fk_inspection_fk_cadet_key ON inspection.cadet_inspection USING btree (fk_inspection, fk_cadet);
CREATE UNIQUE INDEX deficiency_type_name_fk_assosiation_key ON inspection.deficiency_type USING btree (name, fk_assosiation);
CREATE UNIQUE INDEX inspection_date_fk_assosiation_key ON inspection.inspection USING btree (date, fk_assosiation);
CREATE INDEX inspection_fk_assosiation_idx ON inspection.inspection USING btree (fk_assosiation);
ALTER TABLE ONLY authentication.refresh_token
ADD CONSTRAINT refresh_token_fk_user_fkey FOREIGN KEY (fk_user) REFERENCES authentication."user"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY authentication."user"
ADD CONSTRAINT user_fk_assosiation_fkey FOREIGN KEY (fk_assosiation) REFERENCES authentication.assosiation(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY base._uniformsizetouniformsizelist
ADD CONSTRAINT "_uniformsizetouniformsizelist_A_fkey" FOREIGN KEY ("A") REFERENCES base.uniform_size(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY base._uniformsizetouniformsizelist
ADD CONSTRAINT "_uniformsizetouniformsizelist_B_fkey" FOREIGN KEY ("B") REFERENCES base.uniform_sizelist(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY base.cadet
ADD CONSTRAINT cadet_fk_assosiation_fkey FOREIGN KEY (fk_assosiation) REFERENCES authentication.assosiation(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ONLY base.material
ADD CONSTRAINT material_fk_material_group_fkey FOREIGN KEY (fk_material_group) REFERENCES base.material_group(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY base.material_group
ADD CONSTRAINT material_group_fk_assosiation_fkey FOREIGN KEY (fk_assosiation) REFERENCES authentication.assosiation(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY base.material_issued
ADD CONSTRAINT material_issued_fk_cadet_fkey FOREIGN KEY (fk_cadet) REFERENCES base.cadet(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY base.material_issued
ADD CONSTRAINT material_issued_fk_material_fkey FOREIGN KEY (fk_material) REFERENCES base.material(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY base.uniform
ADD CONSTRAINT uniform_fk_generation_fkey FOREIGN KEY (fk_generation) REFERENCES base.uniform_generation(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY base.uniform
ADD CONSTRAINT uniform_fk_size_fkey FOREIGN KEY (fk_size) REFERENCES base.uniform_size(id) ON UPDATE RESTRICT ON DELETE
SET NULL;
ALTER TABLE ONLY base.uniform
ADD CONSTRAINT uniform_fk_uniform_type_fkey FOREIGN KEY (fk_uniform_type) REFERENCES base.uniform_type(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY base.uniform_generation
ADD CONSTRAINT uniform_generation_fk_sizelist_fkey FOREIGN KEY (fk_sizelist) REFERENCES base.uniform_sizelist(id) ON UPDATE
SET NULL ON DELETE
SET NULL;
ALTER TABLE ONLY base.uniform_generation
ADD CONSTRAINT uniform_generation_fk_uniform_type_fkey FOREIGN KEY (fk_uniform_type) REFERENCES base.uniform_type(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY base.uniform_issued
ADD CONSTRAINT uniform_issued_fk_cadet_fkey FOREIGN KEY (fk_cadet) REFERENCES base.cadet(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY base.uniform_issued
ADD CONSTRAINT uniform_issued_fk_uniform_fkey FOREIGN KEY (fk_uniform) REFERENCES base.uniform(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY base.uniform_size
ADD CONSTRAINT uniform_size_fk_assosiation_fkey FOREIGN KEY (fk_assosiation) REFERENCES authentication.assosiation(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY base.uniform_sizelist
ADD CONSTRAINT uniform_sizelist_fk_assosiation_fkey FOREIGN KEY (fk_assosiation) REFERENCES authentication.assosiation(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY base.uniform_type
ADD CONSTRAINT uniform_type_fk_assosiation_fkey FOREIGN KEY (fk_assosiation) REFERENCES authentication.assosiation(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY base.uniform_type
ADD CONSTRAINT uniform_type_fk_default_sizelist_fkey FOREIGN KEY (fk_default_sizelist) REFERENCES base.uniform_sizelist(id) ON UPDATE
SET NULL ON DELETE
SET NULL;
ALTER TABLE ONLY inspection.cadet_deficiency
ADD CONSTRAINT cadet_deficiency_deficiency_id_fkey FOREIGN KEY (deficiency_id) REFERENCES inspection.deficiency(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY inspection.cadet_deficiency
ADD CONSTRAINT cadet_deficiency_fk_cadet_fkey FOREIGN KEY (fk_cadet) REFERENCES base.cadet(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY inspection.cadet_deficiency
ADD CONSTRAINT cadet_deficiency_fk_material_fkey FOREIGN KEY (fk_material) REFERENCES base.material(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY inspection.cadet_deficiency
ADD CONSTRAINT cadet_deficiency_fk_uniform_fkey FOREIGN KEY (fk_uniform) REFERENCES base.uniform(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY inspection.cadet_inspection
ADD CONSTRAINT cadet_inspection_fk_cadet_fkey FOREIGN KEY (fk_cadet) REFERENCES base.cadet(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY inspection.cadet_inspection
ADD CONSTRAINT cadet_inspection_fk_inspection_fkey FOREIGN KEY (fk_inspection) REFERENCES inspection.inspection(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY inspection.deficiency
ADD CONSTRAINT deficiency_fk_deficiency_type_fkey FOREIGN KEY (fk_deficiency_type) REFERENCES inspection.deficiency_type(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY inspection.deficiency
ADD CONSTRAINT deficiency_fk_inspection_created_fkey FOREIGN KEY (fk_inspection_created) REFERENCES inspection.inspection(id) ON UPDATE RESTRICT ON DELETE
SET NULL;
ALTER TABLE ONLY inspection.deficiency
ADD CONSTRAINT deficiency_fk_inspection_resolved_fkey FOREIGN KEY (fk_inspection_resolved) REFERENCES inspection.inspection(id) ON UPDATE RESTRICT ON DELETE
SET NULL;
ALTER TABLE ONLY inspection.deficiency_type
ADD CONSTRAINT deficiency_type_fk_assosiation_fkey FOREIGN KEY (fk_assosiation) REFERENCES authentication.assosiation(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY inspection.inspection
ADD CONSTRAINT inspection_fk_assosiation_fkey FOREIGN KEY (fk_assosiation) REFERENCES authentication.assosiation(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY inspection.uniform_deficiency
ADD CONSTRAINT uniform_deficiency_deficiency_id_fkey FOREIGN KEY (deficiency_id) REFERENCES inspection.deficiency(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY inspection.uniform_deficiency
ADD CONSTRAINT uniform_deficiency_fk_uniform_fkey FOREIGN KEY (fk_uniform) REFERENCES base.uniform(id) ON UPDATE RESTRICT ON DELETE CASCADE;
-- View: inspection.v_deficiency_by_cadet
CREATE OR REPLACE VIEW inspection.v_deficiency_by_cadet AS
SELECT d.id,
    dt.id AS "typeId",
    dt.name AS "typeName",
    d.fk_deficiency_type AS "fk_deficiencyType",
    d.description,
    d.comment,
    d.date_created AS "dateCreated",
    d.date_updated AS "dateUpdated",
    d.date_resolved AS "dateResolved",
    d.user_created AS "userCreated",
    d.user_updated AS "userUpdated",
    d.user_resolved AS "userResolved",
    d.fk_inspection_created AS "fk_inspectionCreated",
    d.fk_inspection_resolved AS "fk_inspectionResolved",
    cd.fk_cadet,
    cd.fk_uniform,
    cd.fk_material
FROM inspection.deficiency d
    JOIN inspection.deficiency_type dt ON dt.id = d.fk_deficiency_type
    JOIN inspection.cadet_deficiency cd ON d.id = cd.deficiency_id
UNION ALL
SELECT d.id,
    dt.id AS "typeId",
    dt.name AS "typeName",
    d.fk_deficiency_type AS "fk_deficiencyType",
    d.description,
    d.comment,
    d.date_created AS "dateCreated",
    d.date_updated AS "dateUpdated",
    d.date_resolved AS "dateResolved",
    d.user_created AS "userCreated",
    d.user_updated AS "userUpdated",
    d.user_resolved AS "userResolved",
    d.fk_inspection_created AS "fk_inspectionCreated",
    d.fk_inspection_resolved AS "fk_inspectionResolved",
    ui.fk_cadet,
    ud.fk_uniform,
    NULL::bpchar AS fk_material
FROM inspection.deficiency d
    JOIN inspection.deficiency_type dt ON dt.id = d.fk_deficiency_type
    JOIN inspection.uniform_deficiency ud ON d.id = ud.deficiency_id
    JOIN base.uniform u ON u.id = ud.fk_uniform
    LEFT JOIN base.uniform_issued ui ON ui.fk_uniform = u.id
    AND ui.date_returned IS NULL;
ALTER TABLE inspection.v_deficiency_by_cadet OWNER TO "uniformServer";
-- View: base.v_cadet_generaloverview
CREATE OR REPLACE VIEW base.v_cadet_generaloverview AS
SELECT c.id,
    c.fk_assosiation,
    c.firstname,
    c.lastname,
    ci.fk_inspection,
    ci.uniform_complete AS "uniformComplete",
    i.date AS "lastInspection",
    count(vdbc.id) AS "activeDeficiencyCount"
FROM base.cadet c
    LEFT JOIN inspection.cadet_inspection ci ON c.id = ci.fk_cadet
    AND ci.fk_inspection = (
        (
            SELECT ii.id
            FROM inspection.inspection ii
                JOIN inspection.cadet_inspection ici ON ii.id = ici.fk_inspection
            WHERE ici.fk_cadet = c.id
            ORDER BY ii.date DESC
            LIMIT 1
        )
    )
    LEFT JOIN inspection.inspection i ON i.id = ci.fk_inspection
    LEFT JOIN inspection.v_deficiency_by_cadet vdbc ON vdbc.fk_cadet = c.id
    AND vdbc."dateResolved" IS NULL
WHERE c.recdelete IS NULL
GROUP BY c.id,
    ci.fk_inspection,
    ci.uniform_complete,
    i.date;
ALTER TABLE base.v_cadet_generaloverview OWNER TO "uniformServer";
DROP TABLE public."CadetDeficiency";
DROP TABLE public."CadetDeficiencyType";
DROP TABLE public."CadetInspection";
DROP TABLE public."Inspection";
DROP TABLE public."MaterialIssued";
DROP TABLE public."Material";
DROP TABLE public."MaterialGroup";
DROP TABLE public."UniformIssued";
DROP TABLE public."Uniform";
DROP TABLE public."UniformGeneration";
DROP TABLE public."UniformType";
DROP TABLE public."_uniformsizetouniformsizelist";
DROP TABLE public."UniformSize";
DROP TABLE public."UniformSizelist";
DROP TABLE public."Cadet";
DROP TABLE public."RefreshToken";
DROP TABLE public."User";
DROP TABLE public."Assosiation";