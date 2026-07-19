"""estrutura inicial

Revision ID: 5fcfa92a209c
Revises:
Create Date: 2026-07-14 13:44:41.157032

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "5fcfa92a209c"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
