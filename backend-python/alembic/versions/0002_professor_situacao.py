"""professor: adiciona colunas de situação (ativo/afastado/carga_reduzida)

Revision ID: 0002_prof_situacao
Revises: 0001_disc_curriculo
Create Date: 2026-06-24
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_prof_situacao"
down_revision = "0001_disc_curriculo"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("professores", sa.Column("situacao", sa.String(), nullable=False, server_default="ativo"))
    op.add_column("professores", sa.Column("carga_disponivel", sa.Integer(), nullable=True))
    op.add_column("professores", sa.Column("data_inicio_situacao", sa.Date(), nullable=True))
    op.add_column("professores", sa.Column("data_fim_situacao", sa.Date(), nullable=True))
    op.add_column("professores", sa.Column("observacao_situacao", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("professores", "observacao_situacao")
    op.drop_column("professores", "data_fim_situacao")
    op.drop_column("professores", "data_inicio_situacao")
    op.drop_column("professores", "carga_disponivel")
    op.drop_column("professores", "situacao")
