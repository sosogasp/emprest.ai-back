-- Esquema inicial do EMPREST.AI (ADR-001 §5/§6).
-- Multi-tenancy por coluna (tenant_id em toda tabela de domínio).

-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('COLABORADOR', 'OPERACOES');

-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('NOTEBOOK', 'MONITOR', 'CABO', 'CAMERA', 'ACESSORIO');

-- CreateEnum
CREATE TYPE "StatusEmprestimo" AS ENUM ('ABERTO', 'DEVOLVIDO');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "papel" "Papel" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "membros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "patrimonio" TEXT NOT NULL,
    "manutencao" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "equipamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emprestimos" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "equipamento_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "retirada" DATE NOT NULL,
    "prazo" DATE NOT NULL,
    "status" "StatusEmprestimo" NOT NULL DEFAULT 'ABERTO',
    "devolvido_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "emprestimos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "membros_usuario_id_tenant_id_key" ON "membros"("usuario_id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipamentos_tenant_id_patrimonio_key" ON "equipamentos"("tenant_id", "patrimonio");

-- AddForeignKey
ALTER TABLE "membros" ADD CONSTRAINT "membros_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros" ADD CONSTRAINT "membros_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprestimos" ADD CONSTRAINT "emprestimos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprestimos" ADD CONSTRAINT "emprestimos_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprestimos" ADD CONSTRAINT "emprestimos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- Regra de negócio não modelável no Prisma (ADR-001 §5): um equipamento só
-- pode ter um empréstimo aberto por vez.
-- ============================================================================
CREATE UNIQUE INDEX "emprestimos_equipamento_id_aberto_key"
  ON "emprestimos" ("equipamento_id")
  WHERE "status" = 'ABERTO';

-- ============================================================================
-- Row Level Security (ADR-001 §5/§7): defesa em profundidade, deny by default.
-- O Prisma conecta com o role dono das tabelas (que bypassa RLS) — a policy é
-- a última barreira entre tenants se uma credencial vazar ou um guard falhar.
-- ============================================================================

-- Funções auxiliares SECURITY DEFINER: leem "membros" sem disparar RLS,
-- evitando recursão nas policies que consultam a própria tabela.
CREATE OR REPLACE FUNCTION public.auth_tem_tenant(t uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.membros WHERE usuario_id = auth.uid() AND tenant_id = t
  )
$$;

CREATE OR REPLACE FUNCTION public.auth_e_operacoes(t uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.membros
    WHERE usuario_id = auth.uid() AND tenant_id = t AND papel = 'OPERACOES'
  )
$$;

CREATE OR REPLACE FUNCTION public.auth_ve_usuario(u uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT u = auth.uid() OR EXISTS (
    SELECT 1
    FROM public.membros a
    JOIN public.membros b ON a.tenant_id = b.tenant_id
    WHERE a.usuario_id = auth.uid() AND b.usuario_id = u
  )
$$;

-- Habilitar RLS em todas as tabelas de domínio.
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usuarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "membros" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "equipamentos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "emprestimos" ENABLE ROW LEVEL SECURITY;

-- tenants: membro enxerga o(s) tenant(s) a que pertence.
CREATE POLICY "tenants_select_membro" ON "tenants"
  FOR SELECT USING (public.auth_tem_tenant(id));

-- usuarios: enxerga a si mesmo ou alguém do mesmo tenant.
CREATE POLICY "usuarios_select_mesmo_tenant" ON "usuarios"
  FOR SELECT USING (public.auth_ve_usuario(id));

-- membros: enxerga os vínculos dos tenants a que pertence.
CREATE POLICY "membros_select_mesmo_tenant" ON "membros"
  FOR SELECT USING (usuario_id = auth.uid() OR public.auth_tem_tenant(tenant_id));

-- equipamentos: membro lê; só OPERACOES escreve.
CREATE POLICY "equipamentos_select_membro" ON "equipamentos"
  FOR SELECT USING (public.auth_tem_tenant(tenant_id));

CREATE POLICY "equipamentos_write_operacoes" ON "equipamentos"
  FOR ALL USING (public.auth_e_operacoes(tenant_id))
  WITH CHECK (public.auth_e_operacoes(tenant_id));

-- emprestimos: colaborador lê os próprios; OPERACOES lê todo o tenant (layout regra 11).
CREATE POLICY "emprestimos_select_dono_ou_operacoes" ON "emprestimos"
  FOR SELECT USING (
    public.auth_tem_tenant(tenant_id)
    AND (usuario_id = auth.uid() OR public.auth_e_operacoes(tenant_id))
  );

-- emprestimos: colaborador cria para si mesmo.
CREATE POLICY "emprestimos_insert_dono" ON "emprestimos"
  FOR INSERT WITH CHECK (
    public.auth_tem_tenant(tenant_id) AND usuario_id = auth.uid()
  );

-- emprestimos: dono ou OPERACOES atualiza (ex.: registrar devolução).
CREATE POLICY "emprestimos_update_dono_ou_operacoes" ON "emprestimos"
  FOR UPDATE USING (
    public.auth_tem_tenant(tenant_id)
    AND (usuario_id = auth.uid() OR public.auth_e_operacoes(tenant_id))
  )
  WITH CHECK (
    public.auth_tem_tenant(tenant_id)
    AND (usuario_id = auth.uid() OR public.auth_e_operacoes(tenant_id))
  );

