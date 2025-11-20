--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-11-20 16:10:48

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 7 (class 2615 OID 24591)
-- Name: calidad; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA calidad;


ALTER SCHEMA calidad OWNER TO postgres;

--
-- TOC entry 2 (class 3079 OID 24688)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA calidad;


--
-- TOC entry 4910 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 266 (class 1255 OID 24726)
-- Name: gen_codigo_documento(); Type: FUNCTION; Schema: calidad; Owner: postgres
--

CREATE FUNCTION calidad.gen_codigo_documento() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    -- OJO: la secuencia va calificada con el esquema
    NEW.codigo := 'DOC-' || LPAD(nextval('calidad.seq_documento')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION calidad.gen_codigo_documento() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 24642)
-- Name: acciones_correctivas; Type: TABLE; Schema: calidad; Owner: postgres
--

CREATE TABLE calidad.acciones_correctivas (
    id_accion integer NOT NULL,
    codigo character varying(20) NOT NULL,
    origen character varying(100) NOT NULL,
    descripcion text NOT NULL,
    id_responsable integer,
    fecha_limite date,
    estado character varying(20) DEFAULT 'Pendiente'::character varying NOT NULL,
    id_auditoria integer,
    responsable text
);


ALTER TABLE calidad.acciones_correctivas OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 24641)
-- Name: acciones_correctivas_id_accion_seq; Type: SEQUENCE; Schema: calidad; Owner: postgres
--

CREATE SEQUENCE calidad.acciones_correctivas_id_accion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE calidad.acciones_correctivas_id_accion_seq OWNER TO postgres;

--
-- TOC entry 4911 (class 0 OID 0)
-- Dependencies: 225
-- Name: acciones_correctivas_id_accion_seq; Type: SEQUENCE OWNED BY; Schema: calidad; Owner: postgres
--

ALTER SEQUENCE calidad.acciones_correctivas_id_accion_seq OWNED BY calidad.acciones_correctivas.id_accion;


--
-- TOC entry 224 (class 1259 OID 24625)
-- Name: auditorias; Type: TABLE; Schema: calidad; Owner: postgres
--

CREATE TABLE calidad.auditorias (
    id_auditoria integer NOT NULL,
    codigo character varying(20) NOT NULL,
    proceso_auditado character varying(100) NOT NULL,
    fecha_programada date NOT NULL,
    id_auditor integer,
    estado character varying(20) DEFAULT 'Pendiente'::character varying NOT NULL,
    resultado character varying(50),
    observaciones text,
    auditor character varying(255)
);


ALTER TABLE calidad.auditorias OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 24624)
-- Name: auditorias_id_auditoria_seq; Type: SEQUENCE; Schema: calidad; Owner: postgres
--

CREATE SEQUENCE calidad.auditorias_id_auditoria_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE calidad.auditorias_id_auditoria_seq OWNER TO postgres;

--
-- TOC entry 4912 (class 0 OID 0)
-- Dependencies: 223
-- Name: auditorias_id_auditoria_seq; Type: SEQUENCE OWNED BY; Schema: calidad; Owner: postgres
--

ALTER SEQUENCE calidad.auditorias_id_auditoria_seq OWNED BY calidad.auditorias.id_auditoria;


--
-- TOC entry 222 (class 1259 OID 24607)
-- Name: documentos; Type: TABLE; Schema: calidad; Owner: postgres
--

CREATE TABLE calidad.documentos (
    id_documento integer NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre_documento character varying(150) NOT NULL,
    version character varying(10) DEFAULT 'v1.0'::character varying NOT NULL,
    fecha date,
    id_responsable integer,
    estado character varying(20) DEFAULT 'Aprobado'::character varying NOT NULL,
    url_archivo text,
    proceso character varying(100)
);


ALTER TABLE calidad.documentos OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 24606)
-- Name: documentos_id_documento_seq; Type: SEQUENCE; Schema: calidad; Owner: postgres
--

CREATE SEQUENCE calidad.documentos_id_documento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE calidad.documentos_id_documento_seq OWNER TO postgres;

--
-- TOC entry 4913 (class 0 OID 0)
-- Dependencies: 221
-- Name: documentos_id_documento_seq; Type: SEQUENCE OWNED BY; Schema: calidad; Owner: postgres
--

ALTER SEQUENCE calidad.documentos_id_documento_seq OWNED BY calidad.documentos.id_documento;


--
-- TOC entry 228 (class 1259 OID 24664)
-- Name: indicadores; Type: TABLE; Schema: calidad; Owner: postgres
--

CREATE TABLE calidad.indicadores (
    id_indicador integer NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre_indicador character varying(150) NOT NULL,
    status character varying(20) DEFAULT 'Activo'::character varying NOT NULL,
    status2 character varying(20) DEFAULT 'Nuevo'::character varying NOT NULL,
    proceso character varying(100),
    id_responsable integer,
    descripcion text,
    unidad_medida character varying(50),
    objetivo_impacto character varying(20),
    meta_objetivo character varying(50),
    estrategia text,
    metodologia text,
    procedimiento text,
    codigo_procedimiento character varying(30),
    frecuencia_medicion character varying(50),
    fecha_registro timestamp without time zone DEFAULT now() NOT NULL,
    principal_objeto text,
    objetivos_adicionales text,
    fecha_deseada date,
    responsable text,
    cod_procedimiento text,
    fecha_deseada_finalizacion date
);


ALTER TABLE calidad.indicadores OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 24663)
-- Name: indicadores_id_indicador_seq; Type: SEQUENCE; Schema: calidad; Owner: postgres
--

CREATE SEQUENCE calidad.indicadores_id_indicador_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE calidad.indicadores_id_indicador_seq OWNER TO postgres;

--
-- TOC entry 4914 (class 0 OID 0)
-- Dependencies: 227
-- Name: indicadores_id_indicador_seq; Type: SEQUENCE OWNED BY; Schema: calidad; Owner: postgres
--

ALTER SEQUENCE calidad.indicadores_id_indicador_seq OWNED BY calidad.indicadores.id_indicador;


--
-- TOC entry 229 (class 1259 OID 24725)
-- Name: seq_documento; Type: SEQUENCE; Schema: calidad; Owner: postgres
--

CREATE SEQUENCE calidad.seq_documento
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE calidad.seq_documento OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 24593)
-- Name: usuarios; Type: TABLE; Schema: calidad; Owner: postgres
--

CREATE TABLE calidad.usuarios (
    id_usuario integer NOT NULL,
    nombre character varying(100) NOT NULL,
    usuario character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    correo character varying(100),
    puesto character varying(100),
    activo boolean DEFAULT true NOT NULL,
    ultimo_login timestamp without time zone
);


ALTER TABLE calidad.usuarios OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 24592)
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: calidad; Owner: postgres
--

CREATE SEQUENCE calidad.usuarios_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE calidad.usuarios_id_usuario_seq OWNER TO postgres;

--
-- TOC entry 4915 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: calidad; Owner: postgres
--

ALTER SEQUENCE calidad.usuarios_id_usuario_seq OWNED BY calidad.usuarios.id_usuario;


--
-- TOC entry 4708 (class 2604 OID 24645)
-- Name: acciones_correctivas id_accion; Type: DEFAULT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.acciones_correctivas ALTER COLUMN id_accion SET DEFAULT nextval('calidad.acciones_correctivas_id_accion_seq'::regclass);


--
-- TOC entry 4706 (class 2604 OID 24628)
-- Name: auditorias id_auditoria; Type: DEFAULT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.auditorias ALTER COLUMN id_auditoria SET DEFAULT nextval('calidad.auditorias_id_auditoria_seq'::regclass);


--
-- TOC entry 4703 (class 2604 OID 24610)
-- Name: documentos id_documento; Type: DEFAULT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.documentos ALTER COLUMN id_documento SET DEFAULT nextval('calidad.documentos_id_documento_seq'::regclass);


--
-- TOC entry 4710 (class 2604 OID 24667)
-- Name: indicadores id_indicador; Type: DEFAULT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.indicadores ALTER COLUMN id_indicador SET DEFAULT nextval('calidad.indicadores_id_indicador_seq'::regclass);


--
-- TOC entry 4701 (class 2604 OID 24596)
-- Name: usuarios id_usuario; Type: DEFAULT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('calidad.usuarios_id_usuario_seq'::regclass);


--
-- TOC entry 4901 (class 0 OID 24642)
-- Dependencies: 226
-- Data for Name: acciones_correctivas; Type: TABLE DATA; Schema: calidad; Owner: postgres
--

COPY calidad.acciones_correctivas (id_accion, codigo, origen, descripcion, id_responsable, fecha_limite, estado, id_auditoria, responsable) FROM stdin;
2	AC-001	Salubridad baja en los departamentos	Se limpiara el lugar	\N	2025-11-22	Cancelada	\N	\N
3	x	x	x	\N	2025-11-21	Cerrada	\N	\N
8	Akdnideidednid	no habia papel	Despedirlo	\N	2025-11-28	En Progreso	\N	\N
10	rr44	No estan limpias las areas	ded	\N	2025-11-28	Pendiente	\N	\N
11	d	f	f	\N	2025-11-21	Pendiente	\N	\N
\.


--
-- TOC entry 4899 (class 0 OID 24625)
-- Dependencies: 224
-- Data for Name: auditorias; Type: TABLE DATA; Schema: calidad; Owner: postgres
--

COPY calidad.auditorias (id_auditoria, codigo, proceso_auditado, fecha_programada, id_auditor, estado, resultado, observaciones, auditor) FROM stdin;
3	AUD-003	Salud	2025-11-27	\N	En Progreso	Se revisara la salubridad de los departamentos	\N	Juanito
1	x	x	2025-11-27	\N	Completada	x	\N	x
4	Hola	Hola	2025-11-29	\N	En Progreso	hola	\N	hola
7	a	a	2025-11-26	\N	Completada	a	\N	a
13	d	d	2025-11-20	\N	En Progreso	d	\N	d
10	f	x	2025-11-20	\N	En Progreso	f	\N	f
16	434	liempieza	2025-11-27	\N	Pendiente	no esta limpio	\N	frfrf
\.


--
-- TOC entry 4897 (class 0 OID 24607)
-- Dependencies: 222
-- Data for Name: documentos; Type: TABLE DATA; Schema: calidad; Owner: postgres
--

COPY calidad.documentos (id_documento, codigo, nombre_documento, version, fecha, id_responsable, estado, url_archivo, proceso) FROM stdin;
7	DOC-0001	Prueba desde SQL	v1.0	2025-10-22	1	Aprobado	\N	Producción
8	DOC-0002	Manual de Calidad	v1.0	2025-10-22	1	Aprobado	\N	Producción
14	DOC-0008	Manual Ejecutivo	v1.0	2025-10-22	1	En Revisión	/uploads/documentos/1761118216354_prueba.pdf	Ejecutivo
18	DOC-003	Devs	v1.0	2025-10-30	1	Obsoleto	/uploads/documentos/1761929903731_indicadores.pdf	DevOps
16	DOC-0010	documento subido	v1.0	2025-10-29	\N	Aprobado	/uploads/documentos/1761714636837_prueba.pdf	\N
21	x	x	v1.0	2025-11-19	1	En Revisión	/uploads/documentos/1763530588940_prueba.pdf	x
\.


--
-- TOC entry 4903 (class 0 OID 24664)
-- Dependencies: 228
-- Data for Name: indicadores; Type: TABLE DATA; Schema: calidad; Owner: postgres
--

COPY calidad.indicadores (id_indicador, codigo, nombre_indicador, status, status2, proceso, id_responsable, descripcion, unidad_medida, objetivo_impacto, meta_objetivo, estrategia, metodologia, procedimiento, codigo_procedimiento, frecuencia_medicion, fecha_registro, principal_objeto, objetivos_adicionales, fecha_deseada, responsable, cod_procedimiento, fecha_deseada_finalizacion) FROM stdin;
6	x	x	Activo	Nuevo	x	\N	x	x	Bajo	90%	x	x	x	\N	x	2025-11-13 15:32:48.054853	x	x	\N	x	x	2025-11-20
4	IND-002	Reclutamiento	Inactivo	Nuevo	Contratar Devs	\N	Si	Dias	Alto	100%	Buscar devs	juan	Contratar devs	\N	Semanal	2025-10-29 19:03:55.0452	Ing.Ricky	contratar devs	\N	Ing.Ricky	PR-002	2025-10-30
7	a	a	Activo	Nuevo	a	\N	a	a	Bajo	a	a	a	a	\N	a	2025-11-18 23:38:36.171297	z	\N	\N	a	a	2025-11-20
3	IND-001	Reclutamiento	Activo	Nuevo	Reclutar a dos programadores	\N	Reclutar a dos programadores de desarrollo web	Porcentaje	Medio	100%	Postular vacante, contestar mensajes, agendar citas	scrum	Postular vacante, contestar mensajes, agendar citas	\N	Semanal	2025-10-29 17:50:11.787206	Jefe de desarrollo	Contratar a dos programadores	\N	Alberto Pérez	RC-001	2025-11-07
\.


--
-- TOC entry 4895 (class 0 OID 24593)
-- Dependencies: 220
-- Data for Name: usuarios; Type: TABLE DATA; Schema: calidad; Owner: postgres
--

COPY calidad.usuarios (id_usuario, nombre, usuario, password_hash, correo, puesto, activo, ultimo_login) FROM stdin;
1	Admin SGC	admin	$2a$06$Jh4KlYwErVL37kLTs8teIeEqcn9NB5n87Cy6HKqeCXhg17KtU//y2	admin@empresa.com	Coordinador de Calidad	t	\N
\.


--
-- TOC entry 4916 (class 0 OID 0)
-- Dependencies: 225
-- Name: acciones_correctivas_id_accion_seq; Type: SEQUENCE SET; Schema: calidad; Owner: postgres
--

SELECT pg_catalog.setval('calidad.acciones_correctivas_id_accion_seq', 11, true);


--
-- TOC entry 4917 (class 0 OID 0)
-- Dependencies: 223
-- Name: auditorias_id_auditoria_seq; Type: SEQUENCE SET; Schema: calidad; Owner: postgres
--

SELECT pg_catalog.setval('calidad.auditorias_id_auditoria_seq', 16, true);


--
-- TOC entry 4918 (class 0 OID 0)
-- Dependencies: 221
-- Name: documentos_id_documento_seq; Type: SEQUENCE SET; Schema: calidad; Owner: postgres
--

SELECT pg_catalog.setval('calidad.documentos_id_documento_seq', 34, true);


--
-- TOC entry 4919 (class 0 OID 0)
-- Dependencies: 227
-- Name: indicadores_id_indicador_seq; Type: SEQUENCE SET; Schema: calidad; Owner: postgres
--

SELECT pg_catalog.setval('calidad.indicadores_id_indicador_seq', 8, true);


--
-- TOC entry 4920 (class 0 OID 0)
-- Dependencies: 229
-- Name: seq_documento; Type: SEQUENCE SET; Schema: calidad; Owner: postgres
--

SELECT pg_catalog.setval('calidad.seq_documento', 11, true);


--
-- TOC entry 4921 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: calidad; Owner: postgres
--

SELECT pg_catalog.setval('calidad.usuarios_id_usuario_seq', 1, true);


--
-- TOC entry 4733 (class 2606 OID 24652)
-- Name: acciones_correctivas acciones_correctivas_codigo_key; Type: CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.acciones_correctivas
    ADD CONSTRAINT acciones_correctivas_codigo_key UNIQUE (codigo);


--
-- TOC entry 4735 (class 2606 OID 24650)
-- Name: acciones_correctivas acciones_correctivas_pkey; Type: CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.acciones_correctivas
    ADD CONSTRAINT acciones_correctivas_pkey PRIMARY KEY (id_accion);


--
-- TOC entry 4728 (class 2606 OID 24635)
-- Name: auditorias auditorias_codigo_key; Type: CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.auditorias
    ADD CONSTRAINT auditorias_codigo_key UNIQUE (codigo);


--
-- TOC entry 4730 (class 2606 OID 24633)
-- Name: auditorias auditorias_pkey; Type: CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.auditorias
    ADD CONSTRAINT auditorias_pkey PRIMARY KEY (id_auditoria);


--
-- TOC entry 4723 (class 2606 OID 24618)
-- Name: documentos documentos_codigo_key; Type: CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.documentos
    ADD CONSTRAINT documentos_codigo_key UNIQUE (codigo);


--
-- TOC entry 4725 (class 2606 OID 24616)
-- Name: documentos documentos_pkey; Type: CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.documentos
    ADD CONSTRAINT documentos_pkey PRIMARY KEY (id_documento);


--
-- TOC entry 4739 (class 2606 OID 24676)
-- Name: indicadores indicadores_codigo_key; Type: CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.indicadores
    ADD CONSTRAINT indicadores_codigo_key UNIQUE (codigo);


--
-- TOC entry 4741 (class 2606 OID 24674)
-- Name: indicadores indicadores_pkey; Type: CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.indicadores
    ADD CONSTRAINT indicadores_pkey PRIMARY KEY (id_indicador);


--
-- TOC entry 4715 (class 2606 OID 24687)
-- Name: usuarios uq_usuarios_correo; Type: CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.usuarios
    ADD CONSTRAINT uq_usuarios_correo UNIQUE (correo);


--
-- TOC entry 4717 (class 2606 OID 24605)
-- Name: usuarios usuarios_correo_key; Type: CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.usuarios
    ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);


--
-- TOC entry 4719 (class 2606 OID 24601)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 4721 (class 2606 OID 24603)
-- Name: usuarios usuarios_usuario_key; Type: CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.usuarios
    ADD CONSTRAINT usuarios_usuario_key UNIQUE (usuario);


--
-- TOC entry 4736 (class 1259 OID 24684)
-- Name: idx_acciones_estado; Type: INDEX; Schema: calidad; Owner: postgres
--

CREATE INDEX idx_acciones_estado ON calidad.acciones_correctivas USING btree (estado);


--
-- TOC entry 4731 (class 1259 OID 24683)
-- Name: idx_auditorias_estado; Type: INDEX; Schema: calidad; Owner: postgres
--

CREATE INDEX idx_auditorias_estado ON calidad.auditorias USING btree (estado);


--
-- TOC entry 4726 (class 1259 OID 24682)
-- Name: idx_documentos_estado; Type: INDEX; Schema: calidad; Owner: postgres
--

CREATE INDEX idx_documentos_estado ON calidad.documentos USING btree (estado);


--
-- TOC entry 4737 (class 1259 OID 24685)
-- Name: idx_indicadores_status; Type: INDEX; Schema: calidad; Owner: postgres
--

CREATE INDEX idx_indicadores_status ON calidad.indicadores USING btree (status, status2);


--
-- TOC entry 4747 (class 2620 OID 24728)
-- Name: documentos trg_codigo_documento; Type: TRIGGER; Schema: calidad; Owner: postgres
--

CREATE TRIGGER trg_codigo_documento BEFORE INSERT ON calidad.documentos FOR EACH ROW EXECUTE FUNCTION calidad.gen_codigo_documento();


--
-- TOC entry 4748 (class 2620 OID 24727)
-- Name: documentos trg_gen_codigo_documento; Type: TRIGGER; Schema: calidad; Owner: postgres
--

CREATE TRIGGER trg_gen_codigo_documento BEFORE INSERT ON calidad.documentos FOR EACH ROW EXECUTE FUNCTION calidad.gen_codigo_documento();


--
-- TOC entry 4744 (class 2606 OID 24658)
-- Name: acciones_correctivas acciones_correctivas_id_auditoria_fkey; Type: FK CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.acciones_correctivas
    ADD CONSTRAINT acciones_correctivas_id_auditoria_fkey FOREIGN KEY (id_auditoria) REFERENCES calidad.auditorias(id_auditoria) ON DELETE SET NULL;


--
-- TOC entry 4745 (class 2606 OID 24653)
-- Name: acciones_correctivas acciones_correctivas_id_responsable_fkey; Type: FK CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.acciones_correctivas
    ADD CONSTRAINT acciones_correctivas_id_responsable_fkey FOREIGN KEY (id_responsable) REFERENCES calidad.usuarios(id_usuario) ON DELETE SET NULL;


--
-- TOC entry 4743 (class 2606 OID 24636)
-- Name: auditorias auditorias_id_auditor_fkey; Type: FK CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.auditorias
    ADD CONSTRAINT auditorias_id_auditor_fkey FOREIGN KEY (id_auditor) REFERENCES calidad.usuarios(id_usuario) ON DELETE SET NULL;


--
-- TOC entry 4742 (class 2606 OID 24619)
-- Name: documentos documentos_id_responsable_fkey; Type: FK CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.documentos
    ADD CONSTRAINT documentos_id_responsable_fkey FOREIGN KEY (id_responsable) REFERENCES calidad.usuarios(id_usuario) ON DELETE SET NULL;


--
-- TOC entry 4746 (class 2606 OID 24677)
-- Name: indicadores indicadores_id_responsable_fkey; Type: FK CONSTRAINT; Schema: calidad; Owner: postgres
--

ALTER TABLE ONLY calidad.indicadores
    ADD CONSTRAINT indicadores_id_responsable_fkey FOREIGN KEY (id_responsable) REFERENCES calidad.usuarios(id_usuario) ON DELETE SET NULL;


-- Completed on 2025-11-20 16:10:48

--
-- PostgreSQL database dump complete
--

