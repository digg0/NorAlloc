"""disciplina: adiciona codigo e ano_semestre; carga_horaria torna-se nullable

Revision ID: 0001_disc_curriculo
Revises:
Create Date: 2026-06-24

Observação: o projeto cria as tabelas via Base.metadata.create_all no startup.
Esta migration é o registro versionado da mudança e serve para atualizar bancos
JÁ existentes (onde a tabela `disciplinas` já foi criada) sem recriá-los. Em
banco novo, o create_all já cria as colunas — não é necessário rodar a migration.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0001_disc_curriculo"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("disciplinas", sa.Column("codigo", sa.String(), nullable=True))
    op.add_column("disciplinas", sa.Column("ano_semestre", sa.Integer(), nullable=True))
    # batch_alter_table garante portabilidade (inclusive SQLite) ao alterar a coluna.
    with op.batch_alter_table("disciplinas") as batch_op:
        batch_op.alter_column(
            "carga_horaria",
            existing_type=sa.Integer(),
            nullable=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("disciplinas") as batch_op:
        batch_op.alter_column(
            "carga_horaria",
            existing_type=sa.Integer(),
            nullable=False,
        )
    op.drop_column("disciplinas", "ano_semestre")
    op.drop_column("disciplinas", "codigo")
