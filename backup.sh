#!/bin/sh
apk add --no-cache rsync

while true; do
  DATUM=$(date +%Y-%m-%d_%H%M)
  BESTAND=/tmp/backup_${DATUM}.sql

  pg_dump -h db -U inventarisatie inventarisatie > ${BESTAND} 2>/dev/null

  if [ -s ${BESTAND} ]; then
    rsync -a ${BESTAND} /backups/
    ls -t /backups/*.sql 2>/dev/null | tail -n +31 | xargs rm -f
    rm -f ${BESTAND}
    echo "[backup] Lokale backup klaar"
    /usr/bin/rclone sync /backups/ gdrive:WinkelPro/backups/ --log-level INFO 2>&1 || echo "[backup] Google Drive sync mislukt"
    echo "[backup] Google Drive sync klaar"
  else
    echo "[backup] Backup mislukt of leeg"
  fi

  sleep 86400
done
