#!/bin/bash
echo "Añadiendo reglas a pg_hba.conf..."

cat <<EOF >> /var/lib/postgresql/data/pg_hba.conf

# Reglas añadidas manualmente
host all all 0.0.0.0/0 trust
host all all ::/0 trust
EOF