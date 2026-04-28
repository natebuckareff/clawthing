#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "error: run as root, for example: sudo ./uninstall.sh" >&2
  exit 1
fi

systemctl disable --now vmlot.service >/dev/null 2>&1 || true
rm -f /etc/systemd/system/vmlot.service
rm -f /etc/sysusers.d/vmlot.conf
rm -f /usr/local/bin/vmlot
systemctl daemon-reload
systemctl reset-failed vmlot.service >/dev/null 2>&1 || true

echo "vmlot uninstalled."
echo "Kept /etc/vmlot and /var/lib/vmlot."
